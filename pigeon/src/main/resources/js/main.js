var m = require("lhorie/mithril");

var Message = function(typeOrData, dataToCopyOpt) {
  var dataToCopy = dataToCopyOpt || typeOrData;
  for (k in dataToCopy) this[k] = dataToCopy[k];
  if (dataToCopyOpt !== undefined) {
    this.$type = "tiwitalk.pigeon.Chat." + typeOrData;
  }
}

Message.prototype.toString = function() { return JSON.stringify(this); }

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
    showOpt.push(m("div", [
      m("p", "Hello, " + ctrl.userInfo.name + "!")
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
    this.socket.send(msg.toString())
  } else {
    console.warn("Specify conversation id");
  }
}

m.mount(document.getElementById("login-box"), chat);

chat.controller.prototype.startConversation = function(_ids) {
  var ids = _ids.slice()
  ids.push(userInfo.id)
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!this.userCache[id]) this.getUserData(id);
  }
  var msg = new Message("StartConversation", { users: ids })
  this.socket.send(msg.toString())
}

chat.controller.prototype.inviteToConversation = function(users, convIdOpt) {
  var convId = convIdOpt || this.lastConv();
  var msg = new Message("InviteToConversation", { id: convId, users: users });
  this.socket.send(msg.toString())
}

chat.controller.prototype.getUserData = function(id) {
  var idOpt = id ? [id] : [];
  this.socket.send(JSON.stringify(new Message("GetUserInfo", { id: idOpt })));
}

