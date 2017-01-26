module.exports = function(RED) {
    "use strict";

    var request = require('request');

    // The main node definition - most things happen in here
    function IpNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;

        node.on('input', function (msg) {
            var checkUrl = 'http://whatismyip.akamai.com/';
            var msg = {payload:""};

            request(checkUrl, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                var ip = body;
                node.status({fill:"green",shape:"dot",text: ip});
                msg.payload = ip;
                node.send(msg);
              } else {
                node.send(null);
              }
            });

            return;
        });

        this.on("close", function() {
            node.status({});
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("ip-public",IpNode);

};