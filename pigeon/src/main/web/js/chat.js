var m = require("lhorie/mithril");
var Message = require("./message.js");

var Chat = {};

Chat.controller = function() {
  this.composeText = m.prop("");
  this.lastLogLength = 0;

  this.scrollCheck = false;
  this.autoScroll = (function(elem, init, ctx) {
    if (this.scrollCheck) {
      var last = ctx.last;
      var lastScrollMax = last.scrollHeight - last.clientHeight
      if (last.scrollTop === lastScrollMax) {
        console.warn("before", elem.scrollTop);
        elem.scrollTop = elem.scrollHeight - elem.clientHeight;
        console.warn("after", elem.scrollTop);
      }
      this.scrollCheck = false;
    }
    ctx.last = {
      scrollTop: elem.scrollTop,
      scrollHeight: elem.scrollHeight,
      clientHeight: elem.clientHeight
    };
  }).bind(this);
};

Chat.view = function(ctrl, args, session) {
  var chatLog = session.chatLogs[session.currentRoom()] || [];
  var roomOpt = args.roomCache[session.currentRoom()];
  var label = "";
  if (roomOpt) {
    label = session.userStringFromIds(args.userCache, roomOpt.users, true);
    chatLog = (roomOpt.chatHistory || []).concat(chatLog);
  }

  if (chatLog.length !== ctrl.lastLogLength) {
    ctrl.scrollCheck = true;
  }
  ctrl.lastLogLength = chatLog.length;

  return m("section.chat.screen", [
    m("header", [
      m("h1.buddy-name", label),
      m("h2.buddy-status", "TODO: Status (or something)")
    ]),
    m("div.messaging", [
      m("ul.container", { config: ctrl.autoScroll }, chatLog.map(function(msg) {
        var text;
        var otherStyle = "";
        if (msg.$type == "tiwitalk.pigeon.Chat.UserMessage") {
          var uid = msg.user;
          var userOpt = args.userCache[uid];
          var dispName = userOpt ? userOpt.name : uid;
          if (!userOpt) {
            args.getUserProfile(uid);
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
        ]);
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
      m("button.messageSend", "Send")
    ])
  ]);
};

module.exports = Chat;
