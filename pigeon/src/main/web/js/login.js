var m = require("mithril");

var Login = {};

Login.controller = function(args) {
  this.emailField = m.prop("");
  this.nameField = m.prop("");
  this.passwordField = m.prop("");
  this.showLoginForm = m.prop(true);
  this.rememberMe = m.prop(true);
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
      } else {
        alert("An error occurred: " + response.status);
      }
    }, function(error) {
      if (error.status == "conflict") {
        alert("A user has already registered with that email.");
      } else {
        alert("Error: " + error.data[0]);
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

  var rememberMeBox = m("label.remember-me", "Remember Me",
    m("input.remember-me[type=checkbox]", {
      onchange: m.withAttr("checked", ctrl.rememberMe),
      checked: ctrl.rememberMe()
    })
  );

  var loginFn = function() {
    var remember = ctrl.rememberMe();
    var email = encodeURIComponent(ctrl.emailField());
    var pw = encodeURIComponent(ctrl.passwordField());
    var params = {
      method: "POST",
      url: "/login?email=" + email + "&password=" + pw
    };
    m.request(params).then(function(response) {
      args.login(response.data, remember);
    }, function(error) {
      window.alert("Failed to log in: " + error.data[0]);
    });
    return false;
  };

  var loginForm = m("form", {
      onsubmit: loginFn,
      style: !ctrl.showLoginForm() ? { display: "none" } : {}
    }, [
    emailInput,
    passwordInput,
    rememberMeBox,
    m("button.form-click[type=submit]", "Login"),
    m("a.login-form-toggle", {
      onclick: function() { ctrl.showLoginForm(false); }
    }, "Not on TiwiTalk yet?")
  ]);

  var registerForm = m("form", {
      onsubmit: ctrl.register,
      style: ctrl.showLoginForm() ? { display: "none" } : {}
    }, [
    emailInput,
    nameInput,
    passwordInput,
    rememberMeBox,
    m("button.form-click[type=submit]", "Register"),
    m("a.login-form-toggle", {
      onclick: function() { ctrl.showLoginForm(true); }
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
