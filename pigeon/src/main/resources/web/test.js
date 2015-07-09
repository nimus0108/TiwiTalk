function runTest() {
  login("TestUser");
  setTimeout(function() {
    //startConversation([]);
    setTimeout(function() {
      s.send(JSON.stringify(["tiwitalk.pigeon.Chat.SetAvailability", {value: 1}]));

      s.send(JSON.stringify(["tiwitalk.pigeon.Chat.GetUserInfo", {}]));
    }, 1000);
  }, 2000);
}
