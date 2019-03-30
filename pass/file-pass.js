module.exports = function(RED) {
    "use strict";

    var fs = require('fs');
    var util = require('../lib/util.js');

    function FilePassNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global

        node.on('input', function (msg) {
            var inp = '';

            inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

            // normalize the path by removing whitespaces on the left and right
            inp = inp.replace(/\s+$/,'');
            inp = inp.replace(/^\s+/,'');

            node.status({});

            // check if file exists
            fs.access(inp, fs.F_OK || fs.R_OK , function(err) {
                if (err) {
                    util.statusFail(node, 'Not Exists');
                    node.send(null);
                } else {
                    util.statusOk(node, 'Exists');
                    node.send(msg);
                }
            });
        });

        this.on("close", function() {
            node.status({});
        });
    }

    // !Register
    RED.nodes.registerType("file-pass", FilePassNode);
};
