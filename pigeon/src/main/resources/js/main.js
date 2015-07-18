/* Libraries */
var m = require("lhorie/mithril");

/* Scripts */
var Message = require("./message.js");

/* Components */
var RoomList = require("./roomlist.js");
var Chat = require("./chat.js");

/* Main app */
var TiwiTalk = {};

TiwiTalk.controller = function() {
  this.loginField = m.prop("");
  this.name = m.prop("");
  this.socket = null;
  this.userCache = {};
  this.roomCache = {};
  this.userInfo = null;
  this.currentRoom = m.prop(null);
  this.chatLogs = {};
  this.composeText = m.prop("");

  this.inviteField = m.prop("");
};
  
TiwiTalk.view = function(ctrl) {
  var showOpt;
  if (ctrl.userInfo === null) {
    var nameInput = m("input[placeholder=username]", {
      oninput: m.withAttr("value", ctrl.loginField),
      value: ctrl.loginField()
    });
    var connectFn = function() { ctrl.login(ctrl.loginField()); return false; };
    showOpt = m("div.splash", [
      m("h1", "TiwiTalk"),
      m("h2", "Demo v0.0.0.3"),
      m("form", { onsubmit: function() { ctrl.register(); return false; } }, [
        m("button[type=submit]", "register"),
        nameInput
      ]),
      m("form", { onsubmit: connectFn }, [
        m("button[type=submit]", "connect"),
        nameInput
      ])
    ]);
  } else {
    var availRadio = [];
    for (var i = 1; i <= 5; i++) {
      availRadio[i] = m("span", [
        m("input.radioinput", {
          name: "avail", id: "avail-" + i, type: "radio",
          value: i, checked: i == ctrl.userInfo.availability,
          onclick: m.withAttr("value", ctrl.setAvailability.bind(ctrl))
        }),
        m("label", { "for": "avail-" + i }, i)
      ]);
    }
    showOpt = m("div.messenger-container", [
      // m("p", "Hello, " + ctrl.userInfo.name + "!"),
      m("div.messenger", [
        m("div#profile", [
          m("span", "Hi, " + ctrl.userInfo.name),
          m("button#logout", { onclick: ctrl.logout.bind(ctrl) }, "Logout")
        ]),
        m("div#sidebar", [
          m("input[placeholder=Enter ID Here]", {
            type: "text", oninput: m.withAttr("value", ctrl.inviteField)
          }),
          m("button", {
            onclick: (function() {
              var targets = ctrl.inviteField().split("[ ,]+")
              ctrl.startRoom(targets);
            }).bind(ctrl)
          }, "Start"),
          m.component(RoomList, {
            currentRoom: ctrl.currentRoom, userInfo: ctrl.userInfo,
            userCache: ctrl.userCache, roomCache: ctrl.roomCache
          })
        ]),
        m("div#chat", [
          m("div.chat-intro", [
            m("div.name", ctrl.userInfo.name),
            m("div.id", ctrl.userInfo.id),
            m("div.availability", availRadio)
          ]),
          m.component(Chat, {
            userCache: ctrl.userCache, userInfo: ctrl.userInfo,
            send: ctrl.send.bind(ctrl), chatLogs: ctrl.chatLogs,
            currentRoom: ctrl.currentRoom,
            getUserProfile: ctrl.getUserProfile.bind(ctrl)
          })
        ])
      ])
    ]);
  }
  return showOpt;
};

TiwiTalk.controller.prototype.logout = function() {
  m.startComputation();
  this.userInfo = null;
  this.currentRoom(null);
  this.chatLogs = {};
  if (this.socket !== null) {
    this.socket.close();
  }
  this.socket = null;
  m.endComputation();
}

TiwiTalk.controller.prototype.login = function(id) {
  this.logout();
  console.log("connecting...");
  var self = this;
  this.socket = new WebSocket("ws://" + location.host + "/chat?id=" + id);
  this.socket.onopen = function(event) {
    console.log("connection established");
    self.getUserProfile();
  };
  this.socket.onclose = function(event) {
    console.log("connection closed")
    if (self.userInfo) {
      window.alert("Lost connection to server.");
      self.logout();
    }
  };
  this.socket.onmessage = function(event) {
    m.startComputation();
    var data = new Message(JSON.parse(event.data));
    // console.debug("received msg", data);
    if (data.$type == "tiwitalk.pigeon.Chat.UserProfile") {
      if (self.userInfo !== null) {
        if (self.userInfo.id === data.id) {
          self.userInfo = data;
          console.info("User data updated", data);
        } else {
          console.info("Fetched user data", data);
        }
      } else {
        self.userInfo = data;
        console.info("User data initialized", data);
        var rooms = data.rooms || [];
        rooms.map(function(r) {
          Message.GetRoomInfo(r).send(self.socket);
        });
      }
      self.userCache[data.id] = data;
    } else if (self.userInfo !== null) {
      self.handleMessages(data);
    }
    m.endComputation();
  };
};

TiwiTalk.controller.prototype.register = function() {
  var self = this;
  var params = { method: "POST", url: "/register?name=" + this.loginField() };
  m.request(params).then(function(response) {
    self.login(response.id);
  });
};

TiwiTalk.controller.prototype.handleMessages = function(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
    this.chatLogs[data.room].push(data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserMessage") {
    this.chatLogs[data.cid].push(data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.Room") {
    this.updateRoomInfo(data);
    console.log("Updated room info", data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.RoomJoined") {
    this.updateRoomInfo(data.room);
    this.userInfo.rooms.push(this.currentRoom());
    console.log("Joined " + this.currentRoom());
  } else if (data.$type == "tiwitalk.pigeon.Chat.MoodColor") {
    this.roomCache[data.room].moodColor = data.color;
    console.log("%c Received color " + data.color, "background: " + data.color + ";");
  } else {
    console.log("unknown: ", data);
  }
};

TiwiTalk.controller.prototype.updateRoomInfo = function(room) {
  this.roomCache[room.id] = room;
  this.currentRoom(room.id);
  this.fetchUserProfileNeeded(room.users);
  if (!this.userInfo.rooms) this.userInfo.rooms = [];
  if (!this.chatLogs[room.id]) this.chatLogs[room.id] = [];
};

TiwiTalk.controller.prototype.send = function(msg, id) {
  var convId = id || this.currentRoom();
  if (convId) {
    Message.Message(msg, convId).send(this.socket);
  } else {
    console.warn("Specify room id");
  }
};

TiwiTalk.controller.prototype.startRoom = function(_ids) {
  var ids = _ids.slice()
  this.fetchUserProfileNeeded(ids);
  Message.StartRoom(ids).send(this.socket);
};

TiwiTalk.controller.prototype.inviteToRoom = function(users, convIdOpt) {
  var convId = convIdOpt || this.currentRoom();
  this.fetchUserProfileNeeded(users);
  Message.InviteToRoom(convId, users).send(this.socket);
};

TiwiTalk.controller.prototype.getUserProfile = function(id) {
  Message.GetUserProfile(id).send(this.socket);
};

TiwiTalk.controller.prototype.fetchUserProfileNeeded = function(ids) {
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!this.userCache[id]) this.getUserProfile(id);
  }
};

TiwiTalk.controller.prototype.setAvailability = function(value) {
  Message.SetAvailability(value).send(this.socket);
};

m.mount(document.getElementById("app"), TiwiTalk);
