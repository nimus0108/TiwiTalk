var m = require("mithril");
var RoomList = {};

RoomList.controller = function() {};

RoomList.view = function(ctrl, args, session) {
  var rooms = session.userInfo.rooms || [];
  return m("ul.chat-list", rooms.map(function(roomId) {
    var isCurrent = roomId == session.currentRoom();
    var classOpt = isCurrent ? ".currentroom" : "";

    var room = args.roomCache[roomId] || { id: roomId, users: [] };
    var roomUsers = room.users;
    var labelOpt;
    if (room.users.length == 0) {
      labelOpt = roomId;
    } else {
      labelOpt = session.userStringFromIds(args.userCache, roomUsers, true);
    }
    var styleOpt = {};
    if (room.moodColor) {
      styleOpt.borderColor = args.roomCache[roomId].moodColor;
    }
    var statusOpt = roomUsers.filter(function(x) {
      return x !== session.userInfo.id;
    });
    if (statusOpt.length == 1) {
      var userOpt = args.userCache[statusOpt[0]];
      statusOpt = userOpt ? userOpt.status : "";
    } else {
      statusOpt = "";
    }
    return m("li.chat-box" + classOpt, {
      onclick: function() { session.currentRoom(roomId) }
    }, [
      m("img.buddy-face[src\=person.png]", { style: styleOpt }),
      m("div.buddy", [
        m("h1.buddy-name", labelOpt),
        m("h2.buddy-quote", statusOpt)
      ])
    ])
  }));
};

module.exports = RoomList;
