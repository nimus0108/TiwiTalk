var m = require("lhorie/mithril");

var SideMenu = {};

SideMenu.controller = function() {
};

SideMenu.view = function(ctrl, userInfo) {
  return m("section.tiwi.sidebar", [
    m("nav.settings", [
      m("ul.options", [
        m("li.feedback", m("span.fa.fa-smile-o")),
        m("li.account", m("span.fa.fa-cog"))
      ])
    ]),
    m("section.personal", [
      m("div.container", [
        m("img.my-face[src=]") // Stop being obsessed with Lily in the code...
      ]),
      m("div.my-info", [
        m("h1.my-name", userInfo.profile.name),
        m("h2.my-status", "TODO: Status")
      ]),
    ]),
    m("section.availability", [
      m("div.wrap", [
        m("h1.current", "You're free right now"),
        m("h2.notes", "Say hello to your friends!")
      ])
    ])
  ]);
};

module.exports = SideMenu;
