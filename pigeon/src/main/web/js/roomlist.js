var m = require("lhorie/mithril");
var RoomList = {};

RoomList.controller = function(args) {
  this.currentRoom = args.currentRoom;

  var self = this;
  this.setActive = function(room) {
    return function() { self.currentRoom(room) };
  };
};

RoomList.view = function(ctrl, args) {
  var rooms = args.userInfo.rooms || [];
  return m("ul.chat-list", rooms.map(function(roomId) {
    var isCurrent = roomId == args.currentRoom();
    var classOpt = isCurrent ? ".currentroom" : "";

    var room = args.roomCache[roomId] || { id: roomId, users: [] };
    var roomUsers = room.users;
    var userNames = room.users.length == 0 ? [roomId]: [];
    for (var i = 0; i < roomUsers.length; i++) {
      if (roomUsers[i] != args.userInfo.id) {
        var userOpt = args.userCache[roomUsers[i]];
        userNames.push(userOpt ? userOpt.name : roomUsers[i]);
      }
    }
    var labelOpt = userNames.join(", ") + (isCurrent ? " (active)" : "");
    var styleOpt = {};
    if (room.moodColor) {
      styleOpt.background = args.roomCache[roomId].moodColor;
    }
    return m("li.chat-box" + classOpt, {
      onclick: ctrl.setActive(roomId),
      style: styleOpt
    }, [
      m("img.buddy-face[src\=jay.jpg]"),
      m("div.buddy", [
        m("h1.buddy-name", labelOpt),
        m("h2.buddy-quote", "TODO: Implement")
      ])
    ])
  }));
};

module.exports = RoomList;
