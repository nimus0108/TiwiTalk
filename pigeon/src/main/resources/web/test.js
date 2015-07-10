function runTest() {
  login("TestUser");
  setTimeout(function() {
    startConversation([]);
    s.send(JSON.stringify(["tiwitalk.pigeon.Chat.SetAvailability", {value: 1}]));

    s.send(JSON.stringify(["tiwitalk.pigeon.Chat.GetUserInfo", {}]));
    setTimeout(function() {
    }, 1000);
  }, 2000);
}
