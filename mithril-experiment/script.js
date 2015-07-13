var messageComponent = {};

messageComponent.message = function(data) {
    this.message = m.prop(data.message);
    // this.color = m.prop(data.color);
    // this.bg = m.prop(data.bg);
    // this.opacity = m.prop(data.opacity);
    // this.animation = m.prop(data.animation);
} 

messageComponent.transcript = Array;

messageComponent.vm = {
    init: function() {
        messageComponent.conversation = messageComponent.transcript(); 
        messageComponent.vm.message = m.prop('');
        // messageComponent.vm.bg("#262626");
        // messageComponent.vm.color("#FFFFFF");
        
        messageComponent.vm.add = function(message) {
            if (message()) {
                messageComponent.vm.transcript.push(messageComponent.message({message: message()}));
                messageComponent.vm.message('');
            }
        };
    }
};

messageComponent.controller = function() {
    messageComponent.vm.init();
}

var msgArray = [];
var x = 2;
for (var i = x - 1; i >= 0; i--) {
    if (i % 2 == 0) {
        msgArray.push(
            m("div.message.friend", [
                m('p.text', 'Sample message')        
            ])
        );
    }
    
    else {
        msgArray.push(
            m("div.message.me", [
                m('p.text', 'Sample message')        
            ])
        );
    }
} 
messageComponent.view = function() {
    console.log(msgArray);
    // document.getElementById('message-container').innerHTML = "";
    return m(".messages", msgArray)
}

m.mount(document.getElementById("message-container"), {controller: messageComponent.controller, view: messageComponent.view});

function changeX(y) {
    x = y;
}

function sendMsg(sss, num) {
    console.log(sss);
    m.startComputation();
    if (num == 1) {
        msgArray.push(
            m("div.message.me", [
                m('p.text', 'add text')        
            ])
        );
    }
    
    else {
        msgArray.push(
            m("div.message.friend", [
                m('p.text', 'no')        
            ])
        );
    }
    m.endComputation();
}