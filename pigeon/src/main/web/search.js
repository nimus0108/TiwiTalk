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
  var searchFn = function() { return ctrl.search(args.socket) };

  return m("div", [
    m("form.search-friend", { onsubmit: searchFn }, [
      m("input", searchInputAttr)
    ]),
    m("ul.searchresults", args.searchResults.map(function(usr) {
      var addFn = function() { args.startRoom([usr.id]) };
      return m("li", [
        m("span", usr.name),
        m("button.invitebtn", { onclick: addFn }, "+")
      ]);
    })),
    args.searchResults.length != 0 ? "" : m("p", "No users found.")
  ]);
};

module.exports = Search;
