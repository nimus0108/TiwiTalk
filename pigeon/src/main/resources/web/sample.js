var nameIn = document.getElementById("name");

var s = null;
var userInfo = null;
var lastConv = null;
var userCache = {};

document.getElementById("login").addEventListener("click", function() {
  login(nameIn.value);
});

function login(_name) {
  if (s !== null) {
    s.close();
  }
  console.log("connecting...");
  s = new WebSocket("ws://" + location.host + "/chat?name=" + _name);
  s.onopen = function(event) {
    console.log("connection established");
    getUserData();
  };
  s.onclose = function(event) {
    console.log("connection closed")
    s = null;
    userInfo = null;
  };
  s.onmessage = function(event) {
    var data = new Message(JSON.parse(event.data));
    // console.debug("received msg", data);
    if (data.$type == "tiwitalk.pigeon.Chat.UserData") {
      if (userInfo !== null) {
        if (userInfo.id === data.id) {
          userInfo = data;
          console.info("User data updated", userInfo);
        } else {
          console.info("Fetched user data", data);
        }
      } else {
        userInfo = data;
        console.info("User data initialized", userInfo);
      }
      userCache[data.id] = data;
    } else if (userInfo !== null) {
      handleMessages(data);
    }
  };
}

function handleMessages(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
    console.log(data.message);
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserMessage") {
    var uid = data.user;
    var dispName = userCache[uid].name || uid;
    console.log("[" + data.cid + "] " + dispName + ": " + data.message);
  } else if (data.$type == "tiwitalk.pigeon.Chat.RoomJoined") {
    lastConv = data.id;
    var convs = userInfo.conversations || [];
    convs.push(lastConv);
    console.log("Joined " + lastConv);
  } else {
    console.log("unknown: ", data);
  }
}

function send(msg, id) {
  var convId = id || lastConv;
  if (convId) {
    var msg = new Message("Message", { message: msg, room: convId });
    s.send(msg.toString())
  } else {
    console.warn("Specify conversation id");
  }
}

function startConversation(_ids) {
  var ids = _ids.slice()
  ids.push(userInfo.id)
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!userCache[id]) getUserData(id);
  }
  var msg = new Message("StartConversation", { users: ids })
  s.send(msg.toString())
}

function getUserData(id) {
  var idOpt = id ? [id] : [];
  s.send(JSON.stringify(new Message("GetUserInfo", { id: idOpt })));
}

function Message(typeOrData, dataToCopyOpt) {
  var dataToCopy = dataToCopyOpt || typeOrData;
  for (k in dataToCopy) this[k] = dataToCopy[k];
  if (dataToCopyOpt !== undefined) {
    this.$type = "tiwitalk.pigeon.Chat." + typeOrData;
  }
}

Message.prototype.toString = function() { return JSON.stringify(this); }
