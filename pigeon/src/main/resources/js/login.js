var m = require("lhorie/mithril");

var Login = {};

Login.controller = function(args) {
  this.loginField = m.prop("");
  this.login = args.login.bind(args.ctrl);
  var self = this;
  this.register = function() {
    var params = { method: "POST", url: "/register?name=" + self.loginField() };
    m.request(params).then(function(response) {
      console.info(response);
      self.login(response.id);
    });
    return false;
  };
};

Login.view = function(ctrl, args) {
  var usernameInput = m("input.register[placeholder=username]", {
    oninput: m.withAttr("value", ctrl.loginField),
    value: ctrl.loginField()
  });
    
  var nameInput = m("input.register[placeholder=name]", {
    oninput: m.withAttr("value", ctrl.loginField),
    value: ctrl.loginField()
  });

  var loginFn = function() {
    ctrl.login(ctrl.loginField());
    return false;
  };

  return m("div.splash", [
    m("h1", "TiwiTalk"),
    m("h2", "Demo v0.0.0.3"),
    m("form", { onsubmit: ctrl.register }, [
      m("button[type=submit]", "register"),
      usernameInput
    ]),
    m("form", { onsubmit: loginFn }, [
      m("button[type=submit]", "connect"),
      nameInput
    ])
  ]);
};

module.exports = Login;
