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
      availRadio[i] = m("span", i, [
        m("input.radioinput", { name: "avail", type: "radio" })
      ]);
    }
    showOpt.push(m("div", [
      m("p", "Hello, " + ctrl.userInfo.name + "!"),
      m("div", [
        m("div#sidebar.col-md-3"),
        m("div#chat.col-md-9", [
          m("div.chat-intro", [
            m("div", ctrl.userInfo.name),
            m("div", ctrl.userInfo.id),
            m("div.availability", availRadio)
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
    } else if (userInfo !== null) {
      self.handleMessages(data);
    }
    m.endComputation();
  };
};

chat.controller.prototype.handleMessages = function(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
    console.log(data.message);
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserMessage") {
    var uid = data.user;
    var dispName = this.userCache[uid].name || uid;
    console.log("[" + data.cid + "] " + dispName + ": " + data.message);
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
    var msg = new Message("Message", { message: msg, room: convId });
    msg.send(this.socket);
  } else {
    console.warn("Specify conversation id");
  }
}

chat.controller.prototype.startConversation = function(_ids) {
  var ids = _ids.slice()
  ids.push(userInfo.id)
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!this.userCache[id]) this.getUserData(id);
  }
  var msg = new Message("StartConversation", { users: ids })
  msg.send(this.socket);
}

chat.controller.prototype.inviteToConversation = function(users, convIdOpt) {
  var convId = convIdOpt || this.lastConv();
  var msg = new Message("InviteToConversation", { id: convId, users: users });
  msg.send(this.socket);
}

chat.controller.prototype.getUserData = function(id) {
  var msg = new Message("GetUserInfo", { id: id ? [id] : [] });
  msg.send(this.socket);
}

m.mount(document.getElementById("app"), chat);
