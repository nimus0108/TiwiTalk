var m = require("mithril");
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

Search.view = function(ctrl, args, session) {
  var contacts = session.userInfo.contacts || [];
  var searchInputAttr = {
    type: "text",
    placeholder: "Search for friends...",
    oninput: m.withAttr("value", ctrl.searchField),
    value: ctrl.searchField()
  };
  var searchFn = function(id) { return ctrl.search(session.socket, id) };
  var results = session.searchResults.filter(function(x) {
    return x.id !== session.userInfo.id;
  });

  return m("div.search-panel", [
    m("form.search-form.pure-form", { onsubmit: searchFn }, [
      m("input[type=text]", searchInputAttr),
    ]),
    results.length != 0 ? "" : m("p", "No users found."),
    m("ul", results.map(function(usr) {
      var startRoomFn = function() { args.startRoom([usr.id]) };
      var addContactAttr;
      if (contacts.indexOf(usr.id) != -1) {
        addContactAttr = { disabled: true }
      } else {
        addContactAttr = {
          onclick: function() { ctrl.addContact(session.socket, usr.id) }
        };
      }
      return m("li", [
        m("span", usr.name),
        m("div.search-btn-toolbar", [
          m("button.sidebar-btn", { onclick: startRoomFn }, m("span.fa.fa-plus")),
          m("button.sidebar-btn", addContactAttr, m("span.fa.fa-user-plus"))
        ])
      ]);
    }))
  ]);
};

module.exports = Search;
