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

messageComponent.view = function() {
    var msgArray = [];
    for (var i = 0; i < 10; i++) {
        msgArray.push(
            m("div.message", [
                m('p.text', 'Sample message')        
            ])
        );
    } 
    console.log(msgArray);
    return m(".messages", msgArray)
}

m.mount(document.getElementById("message-container"), {controller: messageComponent.controller, view: messageComponent.view});