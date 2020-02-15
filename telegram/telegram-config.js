const TelegramBot = require('node-telegram-bot-api');

module.exports = function (RED) {

    var status;
    var token;
    var client;

    function TelegramConfigNode(config) {
        RED.nodes.createNode(this, config);

        var self = this;
        self.secret = self.credentials.secret;

        // create a telegram bot - with no polling since we going to use
        // this only as a sender
        self.bot = new TelegramBot(self.secret, {
            polling: false
        });
        self.bot.on('message', function (message) {
            // do nothing since this is not a handler of message
            const chatId = msg.chat.id;
        });

        this.setStatus = function (c) {
            status = c;
            var s;
            switch (c) {
                case 'connecting':
                    s = {
                        fill: 'yellow',
                        shape: 'ring',
                        text: 'node-red:common.status.connecting'
                    };
                    break;
                case 'prompt':
                    s = {
                        fill: 'yellow',
                        shape: 'ring',
                        text: c
                    };
                    break;
                case 'connect':
                    s = {
                        fill: 'green',
                        shape: 'dot',
                        text: 'node-red:common.status.connected'
                    };
                    break;
                case 'disconnected':
                    s = {
                        fill: 'red',
                        shape: 'ring',
                        text: 'node-red:common.status.disconnected'
                    };
                    break;
                default:
                    s = {
                        fill: 'red',
                        shape: 'ring',
                        text: c
                    };
            }
        };
    }

    // !Register
    RED.nodes.registerType('telegram-config', TelegramConfigNode, {
        credentials: {
            secret: {
                type: 'text'
            }
        }
    });
};
