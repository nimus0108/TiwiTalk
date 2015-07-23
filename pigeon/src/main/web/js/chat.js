var m = require("lhorie/mithril");
var Message = require("./message.js");

var Chat = {};

Chat.controller = function() {
  this.composeText = m.prop("");
};

Chat.view = function(ctrl, args) {
  var chatLog = args.chatLogs[args.currentRoom()] || [];
  return m("section.chat.screen", [
    m("header", [
      m("h1.buddy-name", "TODO: Label (RoomList)"),
      m("h2.buddy-status", "TODO: Status (or something)")
    ]),
    m("div.messaging", [
      m("ul.container", chatLog.map(function(msg) {
        var text;
        var otherStyle = "";
        if (msg.$type == "tiwitalk.pigeon.Chat.UserMessage") {
          var uid = msg.user;
          var userOpt = args.userCache[uid];
          var dispName = userOpt ? userOpt.name : uid;
          if (!userOpt) {
            args.getUserAccount(uid);
          }
          otherStyle = "." + (uid == args.userInfo.id ? "me" : "friend");

          // TODO: Temporary, remove the name part later
          text = dispName + ": " + msg.message;
        } else if (msg.$type == "tiwitalk.pigeon.Chat.Broadcast") {
          return m("h2.announcement", msg.message)
        }
        return m("div" + otherStyle, [
          m("div.wrap", [
            m("span.message", text)
          ])
        ])
      }))
    ]),
    m("form.send", {
      onsubmit: function() {
        var trimmed = ctrl.composeText().trim();
        if (trimmed.length > 0) {
          args.send(trimmed);
        }
        ctrl.composeText("");
        return false;
      }
    }, [
      m("input.form-input[type-text]", {
        type: "text", name: "compose",
        oninput: m.withAttr("value", ctrl.composeText),
        value: ctrl.composeText()
      })
    ])
  ]);
};

module.exports = Chat;
