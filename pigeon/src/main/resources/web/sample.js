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
    var data = JSON.parse(event.data);
    if (data[0] == "tiwitalk.pigeon.Chat.UserData") {
      if (userInfo !== null) {
        if (userInfo.id === data[1].id) {
          userInfo = data[1];
          console.info("User data updated", userInfo);
        } else {
          console.info("Fetched user data", data[1]);
        }
      } else {
        userInfo = data[1];
        console.info("User data initialized", userInfo);
      }
      userCache[data[1].id] = data[1];
    } else if (userInfo !== null) {
      handleMessages(data);
    }
  };
}

function handleMessages(data) {
  if (data[0] == "tiwitalk.pigeon.Chat.Broadcast") {
    console.log(data[1].message);
  } else if (data[0] == "tiwitalk.pigeon.Chat.UserMessage") {
    var uid = data[1].user;
    var dispName = userCache[uid].name || uid;
    console.log("[" + data[1].cid + "] " + dispName + ": " + data[1].message);
  } else if (data[0] == "tiwitalk.pigeon.Chat.RoomJoined") {
    lastConv = data[1].id;
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
    var msg = ["tiwitalk.pigeon.Chat.Message", {
      message: msg, room: convId
    }];
    s.send(JSON.stringify(msg))
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
  var msg = ["tiwitalk.pigeon.Chat.StartConversation", { "users": ids }]
  s.send(JSON.stringify(msg))
}

function getUserData(id) {
  var idOpt = id ? [id] : [];
  s.send(JSON.stringify(["tiwitalk.pigeon.Chat.GetUserInfo",{ id: idOpt }]));
}
