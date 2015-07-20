var m = require("lhorie/mithril");
var Message = require("./message.js");

var Chat = {};

Chat.controller = function() {
  this.composeText = m.prop("");
};

Chat.view = function(ctrl, args) {
  var chatLog = args.chatLogs[args.currentRoom()] || [];
  return m("div.chat", [
    m("div.messageContainer", chatLog.map(function(msg) {
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
        // text = dispName + ": " + msg.message;
        text = msg.message;
      } else if (msg.$type == "tiwitalk.pigeon.Chat.Broadcast") {
        return m("h2.announcement", msg.message)
      }
      return m("div" + otherStyle, [
        m("div.wrap", [
          m("span.message", text)
        ])
      ])
    })),
    m("form.write-message", {
      onsubmit: function() {
        args.send(ctrl.composeText());
        ctrl.composeText("");
        return false;
      }
    }, [
      m("div.messager", [
        m("input.input-box[placeholder=Write Message Here]", {
          type: "text", name: "compose",
          oninput: m.withAttr("value", ctrl.composeText),
          value: ctrl.composeText()
        })
        // m("button[type=submit]", "Send")
      ])
    ])
  ]);
};

module.exports = Chat;
