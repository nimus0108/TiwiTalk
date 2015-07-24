var m = require("lhorie/mithril");
var Search = require("./search.js");

var SideMenu = {};

SideMenu.controller = function(args) {
  this.toggleSidemenu = (function() {
    args.menuToggled(!args.menuToggled());
  }).bind(this);
};

SideMenu.view = function(ctrl, args, session) {
  var toggledClass = args.menuToggled() ? ".sidemenu-active" : "";
  return m("section.sidemenu.sidebar" + toggledClass, [
    m("div.sidemenu-show-btn" + toggledClass, {
      onclick: ctrl.toggleSidemenu
    }, m("span.fa.fa-bars")),
    m("nav.settings", [
      m("ul.options", [
        m("li.feedback", m("span.fa.fa-smile-o")),
        m("li.account", m("span.fa.fa-cog"))
      ])
    ]),
    m("section.personal", [
      m("div.container", [
        m("img.my-face[src=]") 
      ]),
      m("div.my-info", [
        m("h1.my-name", session.userInfo.profile.name),
        m("h2.my-status", "TODO: Status")
      ]),
    ]),
    m("section.availability", [
      m("div.wrap", [
        m("h1.current", "You're free right now"),
        m("h2.notes", "Say hello to your friends!")
      ])
    ]),
    /*
     * m.component(Search, {
     *   socket: session.socket,
     *   searchResults: session.searchResults,
     *   startRoom: args.startRoom,
     *   contacts: session.userInfo.contacts
     * })
     */
  ]);
};

module.exports = SideMenu;
