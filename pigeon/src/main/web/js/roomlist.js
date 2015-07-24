var m = require("lhorie/mithril");
var RoomList = {};

RoomList.controller = function() {};

RoomList.view = function(ctrl, args, session) {
  var rooms = session.userInfo.rooms || [];
  return m("ul.chat-list", rooms.map(function(roomId) {
    var isCurrent = roomId == session.currentRoom();
    var classOpt = isCurrent ? ".currentroom" : "";

    var room = args.roomCache[roomId] || { id: roomId, users: [] };
    var roomUsers = room.users;
    var userNames = room.users.length == 0 ? [roomId]: [];
    for (var i = 0; i < roomUsers.length; i++) {
      if (roomUsers[i] != session.userInfo.id) {
        var userOpt = args.userCache[roomUsers[i]];
        userNames.push(userOpt ? userOpt.name : roomUsers[i]);
      }
    }
    var labelOpt = userNames.join(", ");
    var styleOpt = {};
    if (room.moodColor) {
      styleOpt.background = args.roomCache[roomId].moodColor;
    }
    return m("li.chat-box" + classOpt, {
      onclick: function() { session.currentRoom(roomId) },
      style: styleOpt
    }, [
      m("img.buddy-face[src\=person.png]"),
      m("div.buddy", [
        m("h1.buddy-name", labelOpt),
        m("h2.buddy-quote", "TODO: Implement")
      ])
    ])
  }));
};

module.exports = RoomList;
