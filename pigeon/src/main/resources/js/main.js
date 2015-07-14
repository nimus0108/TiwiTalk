var m = require("lhorie/mithril");

var Message = require("./message.js");

var chat = {};

chat.controller = function() {
  this.nameField = m.prop("");
  this.name = m.prop("");
  this.socket = null;
  this.userCache = {};
  this.userInfo = null;
  this.lastConv = m.prop(null);
  this.chatLog = [];
  this.composeText = m.prop("");

  this.inviteField = m.prop("");
};
  
chat.view = function(ctrl) {
  var showOpt = [];
  if (ctrl.userInfo === null) {
    showOpt.push(m("div", [
      m("input", { oninput: m.withAttr("value", ctrl.nameField) }),
      m("button", { onclick: ctrl.login.bind(ctrl) }, "Connect")
    ]));
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
    showOpt.push(m("div", [
      m("p", "Hello, " + ctrl.userInfo.name + "!"),
      m("div", [
        m("div#sidebar.col-md-3", [
          m("input", {
            type: "text", oninput: m.withAttr("value", ctrl.inviteField)
          }),
          m("button", {
            onclick: (function() {
              var targets = ctrl.inviteField().split("[ ,]")
              ctrl.startConversation(targets);
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
              var uid = msg.user;
              var userOpt = ctrl.userCache[uid];
              var dispName = userOpt ? userOpt.name : uid;
              if (!userOpt) {
                ctrl.getUserData();
              }
              var speaker = uid == ctrl.userInfo.id ? "me" : "somebody";
              var text = "[" + msg.cid + "]" + dispName + ": " + msg.message;
              return m("div.bubble." + speaker, text);
            }))
          ]),
          m("div.write-message", [
            m("input.input-box", {
              type: "text", name: "compose",
              oninput: m.withAttr("value", ctrl.composeText),
              value: ctrl.composeText()
            }),
            m("button", {
              onclick: (function() {
                this.send(this.composeText());
                this.composeText();
              }).bind(ctrl)
            }, "Send")
          ])
        ])
      ])
    ]));
  }
  return m("div", showOpt);
};

chat.controller.prototype.logout = function() {
  m.startComputation();
  if (this.socket !== null) {
    this.socket.close();
  }
  this.socket = null;
  this.userInfo = null;
  m.endComputation();
}

chat.controller.prototype.login = function() {
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

chat.controller.prototype.handleMessages = function(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
    // TODO: handle this
    console.log(data.message);
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserMessage") {
    var uid = data.user;
    var dispName = this.userCache[uid].name || uid;
    this.chatLog.push(data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.RoomJoined") {
    this.lastConv(data.id);
    if (!this.userInfo.conversations) this.userInfo.conversations = [];
    this.userInfo.conversations.push(this.lastConv());
    console.log("Joined " + this.lastConv());
  } else {
    console.log("unknown: ", data);
  }
};

chat.controller.prototype.send = function(msg, id) {
  var convId = id || this.lastConv();
  if (convId) {
    Message.Message(msg, convId).send(this.socket);
  } else {
    console.warn("Specify conversation id");
  }
};

chat.controller.prototype.startConversation = function(_ids) {
  var ids = _ids.slice()
  ids.push(this.userInfo.id)
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!this.userCache[id]) this.getUserData(id);
  }
  Message.StartConversation(ids).send(this.socket);
};

chat.controller.prototype.inviteToConversation = function(users, convIdOpt) {
  var convId = convIdOpt || this.lastConv();
  Message.InviteToConversation(convId, users).send(this.socket);
};

chat.controller.prototype.getUserData = function(id) {
  Message.GetUserInfo(id).send(this.socket);
};

chat.controller.prototype.setAvailability = function(value) {
  Message.SetAvailability(value).send(this.socket);
  this.getUserData();
};

m.mount(document.getElementById("app"), chat);
