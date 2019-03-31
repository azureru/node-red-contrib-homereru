module.exports = function (RED) {
    "use strict";

    const request = require('request');
    const util = require('../lib/util.js');

    function IpNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.on('input', function (originalMsg) {
            var checkUrl = 'http://whatismyip.akamai.com/';
            var msg = {
                payload: ""
            };

            // send request to Akamai to get public `ip`
            request(checkUrl, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    let ip = body;
                    util.statusOk(node, ip);
                    msg.payload = ip;
                    node.send(msg);
                } else {
                    node.send(null);
                }
            });
        });

        this.on("close", function () {
            node.status({});
        });
    }

    // !Register
    RED.nodes.registerType("ip-public", IpNode);
};
