var m = require("lhorie/mithril");
var Message = require("./message.js");

var Search = {};

Search.controller = function() {
  this.searchField = m.prop("");
  this.search = (function(socket) {
    console.info(this.searchField());
    var msg = Message.SearchForUser(this.searchField());
    console.info(msg);
    msg.send(socket);
    return false;
  }).bind(this);
};

Search.view = function(ctrl, args) {
  var searchInputAttr = {
    type: "text",
    placeholder: "name",
    oninput: m.withAttr("value", ctrl.searchField),
    value: ctrl.searchField()
  };
  return m("div", [
    m("form.search-friend", { onsubmit: function() { return ctrl.search(args.socket); } }, [
      m("input", searchInputAttr)
    ]),
    m("div", args.searchResults.map(function(usr) {
      return m("div", usr.name + " (" + usr.id + ")");
    }))
  ]);
};

module.exports = Search;
