var m = require("lhorie/mithril");

var Login = {};

Login.controller = function(args) {
  this.emailField = m.prop("");
  this.nameField = m.prop("");
  this.passwordField = m.prop("");
  var self = this;
  this.register = function() {
    var url = "/register?email=" + self.emailField() + "?name=" + self.nameField();
    var params = { method: "POST", url: url };
    m.request(params).then(function(response) {
      console.info(response);
      if (response.status === "ok") {
        self.login(response.data[0].id);
      } else if (response.status === "conflict") {
        alert("A user has already registered with that email.");
      } else {
        alert("An error occurred");
      }
    });
    return false;
  };
};

Login.view = function(ctrl, args) {
  var nameInput = m("input.register[placeholder=Username]", {
    oninput: m.withAttr("value", ctrl.nameField),
    value: ctrl.nameField()
  });
  
  var emailInput = m("input.form-input[type=email]", {
    placeholder: "Email",
    oninput: m.withAttr("value", ctrl.emailField),
    value: ctrl.emailField()
  });
  
  var passwordInput = m("input.form-input[type=password]", {
    placeholder: "Password",
    oninput: m.withAttr("value", ctrl.passwordField),
    value: ctrl.passwordField()
  });

  var loginFn = function() {
    args.login(ctrl.emailField());
    return false;
  };

  return m("div.launch", [
    m("div.container.intro", [
        m("h1", "TiwiTalk"),
        m("h2", "Say more than just text"),
        m("form", { onsubmit: loginFn }, [
          emailInput,
          passwordInput,
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
