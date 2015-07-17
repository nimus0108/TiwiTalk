var m = require("lhorie/mithril");
var Message = require("./message.js");

var Chat = {};

Chat.controller = function() {
  this.composeText = m.prop("");
};

Chat.view = function(ctrl, args) {
  var chatLog = args.chatLogs[args.currentRoom()] || [];
  return m("div.chat", [
    m("div.view-messages", chatLog.map(function(msg) {
      var text;
      var otherStyle = "";
      if (msg.$type == "tiwitalk.pigeon.Chat.UserMessage") {
        var uid = msg.user;
        var userOpt = args.userCache[uid];
        var dispName = userOpt ? userOpt.name : uid;
        if (!userOpt) {
          args.getUserData();
        }
        otherStyle = "." + (uid == args.userInfo.id ? "me" : "somebody");
        text = dispName + ": " + msg.message;
      } else if (msg.$type == "tiwitalk.pigeon.Chat.Broadcast") {
        text = msg.message;
        otherStyle = ".broadcast";
      }
      return m("div.msg" + otherStyle, text)
    })),
    m("form.write-message", {
      onsubmit: function() {
        args.send(ctrl.composeText());
        ctrl.composeText("");
        return false;
      }
    }, [
      m("input.input-box", {
        type: "text", name: "compose",
        oninput: m.withAttr("value", ctrl.composeText),
        value: ctrl.composeText()
      }),
      m("button[type=submit]", "Send")
    ])
  ]);
};

module.exports = Chat;
