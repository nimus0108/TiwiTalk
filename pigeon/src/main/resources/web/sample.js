var nameIn = document.getElementById("name");

var s;
var userInfo;
var lastConv;

document.getElementById("login").addEventListener("click", function() {
  login(nameIn.value);
});

function login(_name) {
  if (s !== undefined) {
    s.close();
  }
  console.log("connecting...");
  s = new WebSocket("ws://" + location.host + "/chat?name=" + _name);
  s.onopen = function(event) {
    console.log("connection established");
    s.send(JSON.stringify(["tiwitalk.pigeon.Chat.GetUserInfo",{}]));
    s.onmessage = function(event) {
      var data = JSON.parse(event.data);
      if (data[0] == "tiwitalk.pigeon.Chat.UserData") {
        userInfo = data[1];
        handleMessages();
      }
    };
  };
  s.onclose = function(event) {
    console.log("connection closed")
    s = undefined;
    userInfo = undefined;
  };
}

function handleMessages() {
  s.onmessage = function(event) {
    var data = JSON.parse(event.data);
    if (data[0] == "tiwitalk.pigeon.Chat.Broadcast") {
      console.log(data[1].message);
    } else if (data[0] == "tiwitalk.pigeon.Chat.RoomJoined") {
      lastConv = data[1].id;
      console.log("Joined " + lastConv);
    } else if (data[0] == "tiwitalk.pigeon.Chat.UserData") {
      userInfo = data[1];
    } else {
      console.log("unknown: " + event.data);
    }
  };
}

function send(msg, id) {
  var convId = id || lastConv;
  if (convId) {
    var msg = ["tiwitalk.pigeon.Chat.Message", {
      message: msg, room: convId
    }]
    s.send(JSON.stringify(msg))
  } else {
    console.warn("Specify conversation id");
  }
}

function startConversation(_ids) {
  var ids = _ids.slice()
  ids.push(userInfo.id)
  var msg = ["tiwitalk.pigeon.Chat.StartConversation", { "users": ids }]
  s.send(JSON.stringify(msg))
}
