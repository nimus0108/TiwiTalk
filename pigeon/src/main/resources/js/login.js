var m = require("lhorie/mithril");

var Login = {};

Login.controller = function() {
  this.loginField = m.prop("");
};

Login.view = function(ctrl, args) {
  var nameInput = m("input[placeholder=username]", {
    oninput: m.withAttr("value", ctrl.loginField),
    value: ctrl.loginField()
  });

  var registerFn = function() {
    args.register.bind(args.ctrl)();
    return false;
  };

  var connectFn = function() {
    args.login.bind(args.ctrl)(ctrl.loginField());
    return false;
  };

  return m("div.splash", [
    m("h1", "TiwiTalk"),
    m("h2", "Demo v0.0.0.3"),
    m("form", { onsubmit: registerFn }, [
      m("button[type=submit]", "register"),
      nameInput
    ]),
    m("form", { onsubmit: connectFn }, [
      m("button[type=submit]", "connect"),
      nameInput
    ])
  ]);
};

module.exports = Login;
