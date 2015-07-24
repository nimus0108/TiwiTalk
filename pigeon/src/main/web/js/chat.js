var m = require("lhorie/mithril");
var Message = require("./message.js");

var Chat = {};

Chat.controller = function() {
  this.composeText = m.prop("");
};

Chat.view = function(ctrl, args, session) {
  var chatLog = session.chatLogs[session.currentRoom()] || [];
  var roomOpt = args.roomCache[session.currentRoom()];
  var label = roomOpt ? session.userStringFromIds(args.userCache,
                                                  roomOpt.users, true) : "";
  return m("section.chat.screen", [
    m("header", [
      m("h1.buddy-name", label),
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
          otherStyle = "." + (uid == session.userInfo.id ? "me" : "friend");

          // TODO: Temporary, remove the name part later
//          text = dispName + ": " + msg.message;
            text = msg.message;
        } else if (msg.$type == "tiwitalk.pigeon.Chat.Broadcast") {
          return m("h2.announcement", msg.message)
        }
        return m("li" + otherStyle, [
          m("div.wrap", [
            m("span.message", text)
          ]),
          m("br")
        ])
      }))
    ]),
    m("form.send", {
      onsubmit: function() {
        var trimmed = ctrl.composeText().trim();
        if (trimmed.length > 0) {
          session.sendMessage(trimmed);
        }
        ctrl.composeText("");
        return false;
      }
    }, [
      m("input.form-input[type-text]", {
        type: "text", name: "compose",
        oninput: m.withAttr("value", ctrl.composeText),
        value: ctrl.composeText()
      }),
      m("button.messageSend", {
        value: "Send"
      })
    ])
  ]);
};

module.exports = Chat;
