/* Libraries */
var m = require("lhorie/mithril");

/* Scripts */
var Message = require("./message.js");
var Session = require("./session.js");

/* Components */
var Login = require("./login.js");
var SideMenu = require("./sidemenu.js");
var RoomList = require("./roomlist.js");
var Chat = require("./chat.js");

/* Main app */
var TiwiTalk = {};

TiwiTalk.controller = function() {
  this.session = null;

  this.userCache = {};
  this.roomCache = {};

  this.menuToggled = m.prop(false);
};
  
TiwiTalk.view = function(ctrl) {
  var showOpt;
  if (ctrl.session === null || ctrl.session.userInfo === null) {
    // TODO: encapsulate properly
    showOpt = m.component(Login, {
      login: ctrl.login,
      ctrl: ctrl
    });
  } else {
    var menuClass = ctrl.menuToggled() ? ".sidemenu-active" : "";
    showOpt = m("div#messenger" + menuClass, [
      m.component(SideMenu, {
        menuToggled: ctrl.menuToggled,
        startRoom: ctrl.startRoom.bind(ctrl)
      }, ctrl.session),
      m.component(Chat, {
        roomCache: ctrl.roomCache,
        userCache: ctrl.userCache,
        getUserProfile: ctrl.getUserProfile.bind(ctrl)
      }, ctrl.session),
      m("section.roomlist.sidebar", [
        m.component(RoomList, {
          userCache: ctrl.userCache, roomCache: ctrl.roomCache
        }, ctrl.session)
      ])
    ]);
  }
  return showOpt;
};

TiwiTalk.controller.prototype.logout = function() {
  m.startComputation();
  if (this.session !== null) {
    this.session.socket.close();
  }
  this.session = null;
  m.endComputation();
}

TiwiTalk.controller.prototype.login = function(id) {
  this.logout();
  console.log("connecting...");
  var self = this;
  var socket = new WebSocket("ws://" + location.host + "/chat?id=" + id);
  var session = new Session(socket, this.userCache, this.roomCache);
  this.session = session;
  socket.onopen = function(event) {
    console.log("connection established");
    self.getUserAccount();
  };
  socket.onclose = function(event) {
    console.log("connection closed")
    if (session.userInfo) {
      window.alert("Lost connection to server.");
      self.logout();
    }
  };
  socket.onmessage = function(event) {
    m.startComputation();
    var data = new Message(JSON.parse(event.data));
    // console.debug("received msg", data);
    if (data.$type == "tiwitalk.pigeon.Chat.UserAccount") {
      if (session.userInfo !== null) {
        if (session.userInfo.id === data.id) {
          session.userInfo = data;
          console.info("User data updated", data);
        } else {
          console.info("Fetched user data", data);
        }
      } else {
        session.userInfo = data;
        console.info("User data initialized", data);
        var rooms = data.rooms || [];
        rooms.map(function(r) {
          Message.GetRoomInfo(r).send(socket);
        });
      }
      self.userCache[data.id] = data.profile;
    } else if (self.userInfo !== null) {
      self.handleMessages(data);
    }
    m.endComputation();
  };
};

TiwiTalk.controller.prototype.handleMessages = function(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.UserProfile") {
    if (this.session.userInfo.id == data.id) {
      this.session.userInfo.profile = data;
    }
    this.userCache[data.id] = data;
  } else if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
    this.session.chatLogs[data.room].push(data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserMessage") {
    this.session.chatLogs[data.cid].push(data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.Room") {
    this.updateRoomInfo(data);
    console.log("Updated room info", data);
  } else if (data.$type == "tiwitalk.pigeon.Chat.RoomJoined") {
    this.updateRoomInfo(data.room);
    this.session.userInfo.rooms.push(this.session.currentRoom());
    console.log("Joined " + this.session.currentRoom());
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserSearchResult") {
    this.session.searchResults = data.results;
  } else if (data.$type == "tiwitalk.pigeon.Chat.MoodColor") {
    this.roomCache[data.room].moodColor = data.color;
    console.log("%c Received color " + data.color, "background: " + data.color + ";");
  } else {
    console.log("unknown: ", data);
  }
};

TiwiTalk.controller.prototype.updateRoomInfo = function(room) {
  this.roomCache[room.id] = room;
  this.session.currentRoom(room.id);
  this.fetchUserProfileNeeded(room.users);
  if (!this.session.userInfo.rooms) this.session.userInfo.rooms = [];
  if (!this.session.chatLogs[room.id]) this.session.chatLogs[room.id] = [];
};

TiwiTalk.controller.prototype.startRoom = function(_ids) {
  var ids = _ids.slice()
  this.fetchUserProfileNeeded(ids);
  Message.StartRoom(ids).send(this.session.socket);
};

TiwiTalk.controller.prototype.inviteToRoom = function(users, convIdOpt) {
  var convId = convIdOpt || this.session.currentRoom();
  this.fetchUserProfileNeeded(users);
  Message.InviteToRoom(convId, users).send(this.session.socket);
};

TiwiTalk.controller.prototype.getUserProfile = function(id) {
  Message.GetUserProfile(id).send(this.session.socket);
};

TiwiTalk.controller.prototype.getUserAccount = function() {
  Message.GetUserAccount().send(this.session.socket);
};

TiwiTalk.controller.prototype.fetchUserProfileNeeded = function(ids) {
  for (var i = 0; i < ids.length; i ++) {
    var id = ids[i];
    if (!this.userCache[id]) this.getUserProfile(id);
  }
};

m.mount(document.getElementById("app"), TiwiTalk);
