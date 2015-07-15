/* Libraries */
var m = require("lhorie/mithril");

/* Scripts */
var Message = require("./message.js");

/* Main app */
var TiwiTalk = {};

TiwiTalk.controller = function() {
  this.nameField = m.prop("");
  this.name = m.prop("");
  this.socket = null;
  this.userCache = {};
  this.userInfo = null;
  this.lastRoom = m.prop(null);
  this.chatLog = [];
  this.composeText = m.prop("");

  this.inviteField = m.prop("");
};
  
TiwiTalk.view = function(ctrl) {
  var showOpt;
  if (ctrl.userInfo === null) {
    showOpt = m("div", [
      m("h1", "Tiwi"),
      m("form", { onsubmit: function() { ctrl.login(); return false; } }, [
        m("input", { oninput: m.withAttr("value", ctrl.nameField) }),
        m("button[type=submit]", "Connect")
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
    showOpt = m("div", [
      m("p", "Hello, " + ctrl.userInfo.name + "!"),
      m("div", [
        m("div#sidebar.col-md-3", [
          m("input", {
            type: "text", oninput: m.withAttr("value", ctrl.inviteField)
          }),
          m("button", {
            onclick: (function() {
              var targets = ctrl.inviteField().split("[ ,]")
              ctrl.startRoom(targets);
            }).bind(ctrl)
          }, "Start")
        ]),
        m("div#chat.col-md-9", [
          m("div.chat-intro", [
            m("div", "Name: " ,ctrl.userInfo.name),
            m("div", "Id: ", ctrl.userInfo.id),
            m("div.availability", availRadio)
          ]),
          m("div.chat", [
            m("div.view-messages", ctrl.chatLog.map(function(msg) {
              var text;
              var otherStyle = "";
              if (msg.$type == "tiwitalk.pigeon.Chat.UserMessage") {
                var uid = msg.user;
                var userOpt = ctrl.userCache[uid];
                var dispName = userOpt ? userOpt.name : uid;
                if (!userOpt) {
                  ctrl.getUserData();
                }
                otherStyle = "." + (uid == ctrl.userInfo.id ? "me" : "somebody");
                text = "[" + msg.cid + "]" + dispName + ": " + msg.message;
              } else if (msg.$type == "tiwitalk.pigeon.Chat.Broadcast") {
                text = msg.message;
              }
              return m("div.bubble" + otherStyle, text);
            }))
          ]),
          m("form.write-message", {
            onsubmit: (function() {
              this.send(this.composeText());
              this.composeText("");
              return false;
            }).bind(ctrl)
          }, [
            m("input.input-box", {
              type: "text", name: "compose",
              oninput: m.withAttr("value", ctrl.composeText),
              value: ctrl.composeText()
            }),
            m("button[type=submit]", "Send")
          ])
        ])
      ])
    ]);
  }
  return showOpt;
};

TiwiTalk.controller.prototype.logout = function() {
  m.startComputation();
  if (this.socket !== null) {
    this.socket.close();
  }
  this.socket = null;
  this.userInfo = null;
  m.endComputation();
}

TiwiTalk.controller.prototype.login = function() {
  this.logout();
  console.log("connecting...");
  var self = this;
  this.socket = new WebSocket("ws://" + location.host +
                        "/chat?name=" + this.nameField());
  this.socket.onopen = function(event) {
    console.log("connection established");
    self.getUserData();
  };
  this.socket.onclose = function(event) {
    console.log("connection closed")
    m.startComputation();
    self.loginData(null);
    m.endComputation();
  };
  this.socket.onmessage = function(event) {
    m.startComputation();
    var data = new Message(JSON.parse(event.data));
    // console.debug("received msg", data);
    if (data.$type == "tiwitalk.pigeon.Chat.UserData") {
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
      }
      self.userCache[data.id] = data;
    } else if (self.userInfo !== null) {
      self.handleMessages(data);
    }
    m.endComputation();
  };
};

TiwiTalk.controller.prototype.handleMessages = function(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
    this.chatLog.push(data);
    // TODO: handle this
    // console.log(data.message);
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserMessage") {
    this.chatLog.push(data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.RoomJoined") {
    this.lastRoom(data.room.id);
    this.fetchUserDataNeeded(data.room.users);
    if (!this.userInfo.conversations) this.userInfo.conversations = [];
    this.userInfo.conversations.push(this.lastRoom());
    console.log("Joined " + this.lastRoom());
  } else {
    console.log("unknown: ", data);
  }
};

TiwiTalk.controller.prototype.send = function(msg, id) {
  var convId = id || this.lastRoom();
  if (convId) {
    Message.Message(msg, convId).send(this.socket);
  } else {
    console.warn("Specify room id");
  }
};

TiwiTalk.controller.prototype.startRoom = function(_ids) {
  var ids = _ids.slice()
  ids.push(this.userInfo.id)
  this.fetchUserDataNeeded(ids);
  Message.StartRoom(ids).send(this.socket);
};

TiwiTalk.controller.prototype.inviteToRoom = function(users, convIdOpt) {
  var convId = convIdOpt || this.lastRoom();
  this.fetchUserDataNeeded(users);
  Message.InviteToRoom(convId, users).send(this.socket);
};

TiwiTalk.controller.prototype.getUserData = function(id) {
  Message.GetUserInfo(id).send(this.socket);
};

TiwiTalk.controller.prototype.fetchUserDataNeeded = function(ids) {
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!this.userCache[id]) this.getUserData(id);
  }
};

TiwiTalk.controller.prototype.setAvailability = function(value) {
  Message.SetAvailability(value).send(this.socket);
  this.getUserData();
};

m.mount(document.getElementById("app"), TiwiTalk);
