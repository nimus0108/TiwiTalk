var m = require("mithril");
var Message = require("./message");

var Session = function(socket, userCache, roomCache) {
  this.socket = socket;
  this.chatLogs = {};
  this.searchResults = [];
  this.userInfo = null;
  this.currentRoom = m.prop(null);
  this.userCache = userCache;
  this.roomCache = roomCache;
};

Session.prototype.send = function(msg) {
  msg.send(this.socket);
};

Session.prototype.sendMessage = function(msg, id) {
  var convId = id || this.currentRoom();
  if (convId) {
    Message.Message(msg, convId).send(this.socket);
    return true;
  } else {
    console.warn("Specify room id");
    return false;
  }
};

Session.prototype.fetchUserProfilesNeeded = function(userCache, ids) {
  ids.map(function(id) {
    if (!userCache[id]) Message.GetUserProfile(id).send(this.socket);
  })
};

Session.prototype.userStringFromIds = function(userCache, ids, selfId) {
  var userNames = [];
  for (var i = 0; i < ids.length; i++) {
    if (!selfId || ids[i] !== this.userInfo.id) {
      var userOpt = userCache[ids[i]];
      userNames.push(userOpt ? userOpt.name : ids[i]);
    }
  }
  return userNames.join(", ");
};

module.exports = Session;
