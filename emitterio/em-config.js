const emitter = require('emitter-io');

module.exports = function (RED) {
    let status;
    let client;

    function CenConfigNode(config) {
        RED.nodes.createNode(this, config);

        let self = this;

        self.users = {};    

        self.host = config.host;
        self.user = config.user;
        self.channel = config.channel || 'public/';
        self.secret = self.credentials.secret;
        self.info = "";

        self.setStatus('connecting');
        let client = emitter.connect({
            host: self.host,
            port: 8800,
            keepalive: 30,
            secure: false
        });
        client.on('message', function(message){
            var msg = message;
            console.log(message.asObject());

            // broadcast to each `em-input` nodes that use this config
            Object.keys(self.users).forEach(function (id) {
                self.users[id].emit("input", {
                    "uid" : "",
                    "client" : "",
                    "info" : {
                        "user" : "",
                        "client" : "",
                    },
                    "channel" : message.channel,
                    "data" : message.asObject(),
                    "_msgid" : ""
                });
            });        
        });
        client.on('connect', function (con) {
            self.setStatus('connect');
        });
        client.on('disconnect', function () {
            self.setStatus('disconnected');
        });
        client.on('error', function (err) {
            self.setStatus('prompt');
        });

        client.subscribe({
            key : self.secret,
            channel : self.channel
        });

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
    RED.nodes.registerType('em-config', CenConfigNode, {
        credentials: {
            secret: {
                type: 'text'
            }
        }
    });
};
