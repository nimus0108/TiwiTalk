/* Libraries */
var m = require("lhorie/mithril");

/* Scripts */
var Message = require("./message.js");

/* Components */
var Login = require("./login.js");
var RoomList = require("./roomlist.js");
var Chat = require("./chat.js");
var Search = require("./search.js");

/* Main app */
var TiwiTalk = {};

TiwiTalk.controller = function() {
  this.socket = null;
  this.userCache = {};
  this.roomCache = {};
  this.userInfo = null;
  this.currentRoom = m.prop(null);
  this.chatLogs = {};
  this.searchResults = [];
  this.composeText = m.prop("");

  this.inviteField = m.prop("");
};
  
TiwiTalk.view = function(ctrl) {
  var showOpt;
  if (ctrl.userInfo === null) {
    // TODO: encapsulate properly
    showOpt = m.component(Login, {
      login: ctrl.login,
      ctrl: ctrl
    });
  } else {    
    var availRadio = []; /* stupid and useless */
    // for (var i = 1; i <= 5; i++) {
    //   availRadio[i] = m("span", [
    //     m("input.radioinput", {
    //       name: "avail", id: "avail-" + i, type: "radio",
    //       value: i, checked: i == ctrl.userInfo.profile.availability,
    //       onclick: m.withAttr("value", ctrl.setAvailability.bind(ctrl))
    //     }),
    //     m("label", { "for": "avail-" + i }, i)
    //   ]);
    // }
    
    // m("div#profile", [
    //   m("span", "Hi, " + ctrl.userInfo.profile.name),
    //   m("button#logout", { onclick: ctrl.logout.bind(ctrl) }, "Logout")
    // ]),
    
    showOpt = m("div#messenger", [
      m("div.tiwi", [
    	  m("div.friend-preview", [
    	    m("div.face-container", [
    	      m("div.vertical-container", [
    	        m("div.vertical-align", [
    	          m("img.face[src=/logo.png]")  
    	        ]),  
    	      ]),  
    	    ]),
    	    m("div.show", [
    	      m("div.vertical-container", [
    	        m("div.vertical-align", [
    	          m("h1.friend-name", ctrl.userInfo.profile.name),
    	          m("h2.excerpt", "")  
    	        ]),  
    	      ]),  
    	    ]),  
    	  ]),
    	  m("div.avail-status", [
    	    m("h1.avail", "You are busy right now"),
    	    m("h2.tip", "People won't bother you unless Lily's here")
    	  ]),
        m.component(Search, {
          socket: ctrl.socket,
          searchResults: ctrl.searchResults,
          startRoom: ctrl.startRoom.bind(ctrl)
        })
    	]),
      // end tiwi
      
      
      
      // m("div.preview", [
    	//   m("div.search", [
    	//     m("form", [
    	//       m("input.search-friend", {
    	//         type: "text", placeholder: "Search"  
    	//       }),  
    	//     ]),  
    	//   ]),
    	//   m("div.friend-preview", [
    	//     m("div.face-container", [
    	//       m("div.vertical-container", [
    	//         m("div.vertical-align", [
    	//           m("img.face[src=/person.jpg]")  
    	//         ]),  
    	//       ]),  
    	//     ]),
    	//     m("div.show", [
    	//       m("div.vertical-container", [
    	//         m("div.vertical-align", [
    	//           m("h1.friend-name", "friendname"),
    	//           m("h2.excerpt", "this is the exerpt")  
    	//         ]),  
    	//       ]),  
    	//     ]),  
    	//   ]),
    	// ]),
      
      //start chat
      m("div.conversation-scr", [
        m("div.header", [
          m("div.identity", [
            m("h1.friend-name", ctrl.userInfo.profile.name),
            m("h2.status", ctrl.userInfo.id)
          ])
        ]),
      // m("div#chat", [
      //   m("div.chat-intro", [
      //     m("div.name", ctrl.userInfo.profile.name),
      //     m("div.id", ctrl.userInfo.id),
      //     m("div.availability", availRadio)
      //   ]),
        m.component(Chat, {
          userCache: ctrl.userCache, userInfo: ctrl.userInfo,
          send: ctrl.send.bind(ctrl), chatLogs: ctrl.chatLogs,
          currentRoom: ctrl.currentRoom,
          getUserProfile: ctrl.getUserProfile.bind(ctrl)
        })
      ]),
      //end chat
      
      //start preview
      m("div.preview", [
        m("div.search", [
  	      m("input.search-friend", {
  	        type: "text", placeholder: "Enter ID Here", oninput: m.withAttr("value", ctrl.inviteField)  
  	      }),  
          m("button.start", {
            onclick: (function() {
              var targets = ctrl.inviteField().split("[ ,]+")
              ctrl.startRoom(targets);
            }).bind(ctrl)
          }, "start talking"),
    	  ]),
        m.component(RoomList, {
          currentRoom: ctrl.currentRoom, userInfo: ctrl.userInfo,
          userCache: ctrl.userCache, roomCache: ctrl.roomCache
        })
      ])
      //end preview
      
    ]); //showOpt
  } //if
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
    self.getUserAccount();
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
    if (data.$type == "tiwitalk.pigeon.Chat.UserAccount") {
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
      self.userCache[data.id] = data.profile;
    } else if (self.userInfo !== null) {
      self.handleMessages(data);
    }
    m.endComputation();
  };
};

TiwiTalk.controller.prototype.handleMessages = function(data) {
  if (data.$type == "tiwitalk.pigeon.Chat.UserProfile") {
    this.userInfo.profile = data;
    this.userCache[data.id] = data;
  } else if (data.$type == "tiwitalk.pigeon.Chat.Broadcast") {
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
  } else if (data.$type == "tiwitalk.pigeon.Chat.UserSearchResult") {
    this.searchResults = data.results;
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

TiwiTalk.controller.prototype.getUserAccount = function() {
  Message.GetUserAccount().send(this.socket);
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
