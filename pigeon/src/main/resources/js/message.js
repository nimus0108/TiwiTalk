/*
 * Class to help handle messages sent and received from the server.
*/
var Message = function(typeOrData, dataToCopyOpt) {
  var dataToCopy = dataToCopyOpt || typeOrData;
  for (k in dataToCopy) this[k] = dataToCopy[k];
  if (dataToCopyOpt !== undefined) {
    this.$type = "tiwitalk.pigeon.Chat." + typeOrData;
  }
};

/* Returns the underlying JSON of this message. */
Message.prototype.toString = function() { return JSON.stringify(this); }

/* Sends a message via the WebSocket parameter */
Message.prototype.send = function(socket) { socket.send(this.toString()); }

/* Constructs a (chat) Message message */
Message.Message = function(message, room) {
  return new Message("Message", { message: message, room: room });
};

/* Constructs a StartRoom message */
Message.StartRoom = function(users) {
  return new Message("StartRoom", { users: users });
};

/* Constructs an InviteToRoom message */
Message.InviteToRoom = function(id, users) {
  return new Message("InviteToRoom", { id: id, users: users });
};

/* Constructs a GetUserInfo message */
Message.GetUserInfo = function(id) {
  return new Message("GetUserInfo", { id: id ? [id] : [] });
};

/* Constructs a SetAvailability message */
Message.SetAvailability = function(value) {
  return new Message("SetAvailability", { value: value });
};

module.exports = Message;
