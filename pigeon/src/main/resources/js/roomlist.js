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
  return m("div.roomContainer", rooms.map(function(room) {
    var isCurrent = room == args.currentRoom();
    var classOpt = isCurrent ? ".currentroom" : "";

    var roomUsers = args.roomCache[room].users;
    var userNames = [];
    for (var i = 0; i < roomUsers.length; i++) {
      var userOpt = args.userCache[roomUsers[i]];
      userNames.push(userOpt ? userOpt.name : roomUsers[i]);
    }
    var labelOpt = userNames.join(", ") + (isCurrent ? " (active)" : "");
    var styleOpt = {};
    if (args.roomCache[room].moodColor) {
      styleOpt.background = args.roomCache[room].moodColor;
    }
    return m("div.messageTarget" + classOpt, {
      onclick: ctrl.setActive(room),
      style: styleOpt
    }, labelOpt);
  }));
};

module.exports = RoomList;
