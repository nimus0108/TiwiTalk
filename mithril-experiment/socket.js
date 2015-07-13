var chatSocket = new WebSocket("ws://localhost:9876/chat?name=jaymo");
var standardIDs = ['8e25d18f-bfba-4d5c-9291-80c2145d70df', 'b965f78e-827e-493e-85ac-5735bcfef0e8'];
chatSocket.startConversation(standardIDs);

function onSend(message) {
	chatSocket.send(message);
}

