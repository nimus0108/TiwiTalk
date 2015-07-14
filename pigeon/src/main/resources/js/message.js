/*
 * Class to help handle messages sent and received from the server.
*/
var Message = function(typeOrData, dataToCopyOpt) {
  var dataToCopy = dataToCopyOpt || typeOrData;
  for (k in dataToCopy) this[k] = dataToCopy[k];
  if (dataToCopyOpt !== undefined) {
    this.$type = "tiwitalk.pigeon.Chat." + typeOrData;
  }
}

/* Returns the underlying JSON of this message. */
Message.prototype.toString = function() { return JSON.stringify(this); }

/* Sends a message via the WebSocket parameter */
Message.prototype.send = function(socket) { socket.send(this.toString()); }

module.exports = Message;
