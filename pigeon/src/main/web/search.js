var m = require("lhorie/mithril");
var Message = require("./message.js");

var Search = {};

Search.controller = function() {
  this.searchField = m.prop("");
  this.search = (function(socket) {
    var query = this.searchField().trim();
    if (query) {
      var msg = Message.SearchForUser(query);
      msg.send(socket);
    }
    return false;
  }).bind(this);
};

Search.view = function(ctrl, args) {
  var searchInputAttr = {
    type: "text",
    placeholder: "Search for friends...",
    oninput: m.withAttr("value", ctrl.searchField),
    value: ctrl.searchField()
  };
  var searchFn = function() { return ctrl.search(args.socket) };

  return m("div.search-panel", [
    m("form", { onsubmit: searchFn }, [
      m("input", searchInputAttr)
    ]),
    args.searchResults.length != 0 ? "" : m("p", "No users found."),
    m("ul", args.searchResults.map(function(usr) {
      var addFn = function() { args.startRoom([usr.id]) };
      return m("li", [
        m("span", usr.name),
        m("button.invitebtn", { onclick: addFn }, "+")
      ]);
    }))
  ]);
};

module.exports = Search;
