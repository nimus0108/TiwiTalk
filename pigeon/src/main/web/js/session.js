var m = require("lhorie/mithril");
var Message = require("./message");

var Session = function(socket) {
  this.socket = socket;
  this.chatLogs = {};
  this.searchResults = [];
  this.userInfo = null;
  this.currentRoom = m.prop(null);
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

module.exports = Session;
