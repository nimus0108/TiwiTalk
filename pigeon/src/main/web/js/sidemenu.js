var m = require("mithril");
var Search = require("./search.js");
var Message = require("./message.js");

var SideMenu = {};

SideMenu.controller = function(args, session) {
  this.toggleSidemenu = (function() {
    args.menuToggled(!args.menuToggled());
  }).bind(this);
  this.editingStatus = m.prop(false);
  this.statusField = m.prop(session.userInfo.profile.status);
};

SideMenu.view = function(ctrl, args, session) {
  var toggledClass = args.menuToggled() ? ".sidemenu-active" : "";
  var display = function(yes) {
    return yes ? {} : { display: "none" };
  };
  return m("section.sidemenu.sidebar" + toggledClass, [
    m("div.sidemenu-show-btn" + toggledClass, {
      onclick: ctrl.toggleSidemenu
    }, m("span.fa.fa-bars")),
    m("nav.settings", [
      m("ul.options.options-left", [
        m("li", m("span.fa.fa-smile-o"))
      ]),
      m("ul.options.options-right", [
        m("li", m("span.fa.fa-cog")),
        m("li", {
          title: "Log Out",
          onclick: function() { args.logout(true) }
        }, m("span.fa.fa-sign-out"))
      ])
    ]),
    m("section.personal", [
      m("div.container", [
        m("span.fa.fa-user.my-face") 
      ]),
      m("div.my-info", [
        m("h1.my-name", session.userInfo.profile.name),
        m("div.my-status-container", [
          m("div", { style: display(!ctrl.editingStatus()) }, [
            m("h2.my-status", session.userInfo.profile.status),
            m("span.fa.fa-pencil.status-edit", {
              onclick: function() { ctrl.editingStatus(true); } 
            })
          ]),
          m("form.pure-form", {
            style: display(ctrl.editingStatus()),
            onsubmit: function() {
              if (ctrl.statusField() !== session.userInfo.profile.status) {
                var msg = Message.SetStatus(ctrl.statusField());
                session.send(msg);
                ctrl.editingStatus(false);
              }
              return false;
            }
          }, [
            m("input[type=text]", {
              oninput: m.withAttr("value", ctrl.statusField),
              value: ctrl.statusField()
            }),
            m("button.pure-button.sidebar-btn[type=submit]", m("span.fa.fa-check")),
            m("button.pure-button.sidebar-btn", {
              onclick: function() { ctrl.editingStatus(false); }
            }, m("span.fa.fa-times"))
          ])
        ])
      ]),
    ]),
    m("section.availability", [
      m("div.wrap", [
        m("h1.current", "You're free right now")
    //  m("h2.notes", "Say hello to your friends!")
      ])
    ]),
    m.component(Search, { startRoom: args.startRoom }, session)
  ]);
};

module.exports = SideMenu;
