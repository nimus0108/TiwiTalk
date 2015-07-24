var m = require("lhorie/mithril");

var Login = {};

Login.controller = function(args) {
  this.loginField = m.prop("");
  this.passwordField = m.prop("");
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
    
  var inputName = m("input.form-input[type=text]", {
    placeholder: "Your Name",
    oninput: m.withAttr("value", ctrl.loginField),
    value: ctrl.loginField()
  });
  
  var loginEmail = m("input.form-input[type=text]", {
    placeholder: "User ID",
    oninput: m.withAttr("value", ctrl.loginField),
    value: ctrl.loginField()
  });
  
  var loginPassword = m("input.form-input[type=password]", {
    placeholder: "Password",
    oninput: m.withAttr("value", ctrl.passwordField),
    value: ctrl.passwordField()
  });

  var loginFn = function() {
    ctrl.login(ctrl.loginField());
    return false;
  };

  return m("div.launch", [
    m("div.container.intro", [
        m("h1", "TiwiTalk"),
        m("h2", "Say more than just text"),
        m("form", { onsubmit: loginFn }, [
          loginEmail,
          loginPassword,
          m("button.form-click[type=submit]", "Sign In"),
        ]),
        m("h3", "Alpha v0.0.7")
        /* m("form", { onsubmit: ctrl.register }, [
         *   m("button[type=submit]", "register"),
         *   usernameInput
         * ])
         */
      ])
  ]);
};

module.exports = Login;
