const Centrifuge = require('centrifuge');
const Token = require('../lib/token.js');

module.exports = function (RED) {
    let status;
    let token;
    let client;

    function CenConfigNode(config) {
        RED.nodes.createNode(this, config);

        let self = this;

        self.users = {};    
        self.host = config.host;
        self.user = config.user;
        self.channel = config.channel || 'public';
        self.secret = self.credentials.secret;
        self.info = "";

        let timestamp = "" + Math.round(new Date().getTime() / 1000);
        let tokenizer = new Token(self.secret);
        let clientToken = tokenizer.clientToken(self.user, "" + timestamp, self.info);

        let client = new Centrifuge({
            url: self.host,
            user: self.user,
            timestamp: timestamp,
            info: self.info,
            debug: false,
            token: clientToken        
        });
        let callbacks = {
            "message": function (message) {
                var msg = message;
                Object.keys(self.users).forEach(function (id) {
                    self.users[id].emit("input", msg);
                });
            },
            "join": function (message) {
            },
            "leave": function (message) {
            },
            "subscribe": function (context) {
            },
            "error": function (errContext) {
                console.log(errContext);
            },
            "unsubscribe": function (context) {
            }
        }
        client.on('connecting', function () {
            self.setStatus('connecting');
        });
        client.on('connect', function () {
            self.setStatus('connect');
            self.connected = true;
        });
        client.subscribe(self.channel, callbacks);
        client.connect();

        this.register = function (clientNode) {
            self.users[clientNode.id] = clientNode;
        };

        this.deregister = function (clientNode, done) {
            delete self.users[clientNode.id];
            return done();
        };

        this.setStatus = function (c) {
            status = c;
            let s;
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

            Object.keys(self.users).forEach(function (id) {
                self.users[id].status(s);
            });
        };
    }

    // !Register
    RED.nodes.registerType('cen-config', CenConfigNode, {
        credentials: {
            secret: {
                type: 'text'
            }
        }
    });
};
