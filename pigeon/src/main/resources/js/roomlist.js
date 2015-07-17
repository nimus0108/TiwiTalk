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
  return m("div.roomContainer", rooms.map(function(roomId) {
    var isCurrent = roomId == args.currentRoom();
    var classOpt = isCurrent ? ".currentroom" : "";

    var room = args.roomCache[roomId] || { id: roomId, users: [] };
    var roomUsers = room.users;
    var userNames = room.users.length == 0 ? [roomId]: [];
    for (var i = 0; i < roomUsers.length; i++) {
      var userOpt = args.userCache[roomUsers[i]];
      userNames.push(userOpt ? userOpt.name : roomUsers[i]);
    }
    var labelOpt = userNames.join(", ") + (isCurrent ? " (active)" : "");
    var styleOpt = {};
    if (room.moodColor) {
      styleOpt.background = args.roomCache[room].moodColor;
    }
    return m("div.messageTarget" + classOpt, {
      onclick: ctrl.setActive(roomId),
      style: styleOpt
    }, labelOpt);
  }));
};

module.exports = RoomList;
