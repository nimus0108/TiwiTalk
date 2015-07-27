var m = require("lhorie/mithril");

var Login = {};

Login.controller = function(args) {
  this.emailField = m.prop("");
  this.nameField = m.prop("");
  this.passwordField = m.prop("");
  var self = this;
  this.register = function() {
    var email = encodeURIComponent(self.emailField());
    var name = encodeURIComponent(self.nameField());
    var pw = encodeURIComponent(self.passwordField());
    var url = "/register?email=" + email + "&name=" + name + "&password=" + pw;
    var params = { method: "POST", url: url };
    m.request(params).then(function(response) {
      console.info(response);
      if (response.status === "ok") {
        args.login(response.data);
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
  var nameInput = m("input.form-input[type=text]", {
    placeholder: "Username",
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
    var email = encodeURIComponent(ctrl.emailField());
    var pw = encodeURIComponent(ctrl.passwordField());
    var params = {
      method: "POST",
      url: "/login?email=" + email + "&password=" + pw
    };
    m.request(params).then(function(response) {
      args.login(response.data);
    }, function(error) {
      window.alert("Failed to log in: " + error.data[0]);
    });
    return false;
  };

  var loginForm = m("form.login-form", { onsubmit: loginFn }, [
    emailInput,
    passwordInput,
    m("button.form-click[type=submit]", "Login"),
    m("a", {
      id: "showRegister",
      href: "#"
    }, "Not on TiwiTalk yet?")
  ]);

  var registerForm = m("form.register-form[style='display: none;']", { onsubmit: ctrl.register }, [
    emailInput,
    nameInput,
    passwordInput,
    m("button.form-click[type=submit]", "Register"),
    m("a", {
      id: "showLogin",
      href: "#"
    }, "Already on TiwiTalk?")
  ]);

  return m("div.launch", [
    m("div.launch-bg", ""),
    m("div.container.intro", [
        m("div", [
          m("h1.title", "TiwiTalk"),
          m("h3.version", "Alpha v0.1.2")
        ]),
        m("h2.subtitle", "Say more than just text"),
        loginForm,
        registerForm
      ])
  ]);
};

module.exports = Login;
