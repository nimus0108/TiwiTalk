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
  return m("ul.roomlist", rooms.map(function(room) {
    var isCurrent = room == args.currentRoom();
    var classOpt = isCurrent ? ".currentroom" : "";
    var labelOpt = isCurrent ? room + " (active)" : room;
    return m("li" + classOpt, { onclick: ctrl.setActive(room) }, labelOpt);
  }));
};

module.exports = RoomList;
