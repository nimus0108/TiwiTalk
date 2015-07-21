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
  this.addContact = (function(socket, selected) {
    var msg = Message.ModifyContacts([selected], []);
    msg.send(socket);
  }).bind(this);
};

Search.view = function(ctrl, args) {
  var contacts = args.contacts || [];
  var searchInputAttr = {
    type: "text",
    placeholder: "Search for friends...",
    oninput: m.withAttr("value", ctrl.searchField),
    value: ctrl.searchField()
  };
  var searchFn = function(id) { return ctrl.search(args.socket, id) };

  return m("div.search-panel", [
    m("form.search-form.pure-form", { onsubmit: searchFn }, [
      m("input[type=text]", searchInputAttr),
    ]),
    args.searchResults.length != 0 ? "" : m("p", "No users found."),
    m("ul", args.searchResults.map(function(usr) {
      var startRoomFn = function() { args.startRoom([usr.id]) };
      var addContactAttr;
      if (contacts.indexOf(usr.id) != -1) {
        addContactAttr = { disabled: true }
      } else {
        addContactAttr = {
          onclick: function() { ctrl.addContact(args.socket, usr.id) }
        };
      }
      return m("li", [
        m("span", usr.name),
        m("div.search-btn-toolbar", [
          m("button", { onclick: startRoomFn }, m("span.fa.fa-plus")),
          m("button", addContactAttr, m("span.fa.fa-user-plus"))
        ])
      ]);
    }))
  ]);
};

module.exports = Search;
