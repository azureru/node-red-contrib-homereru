module.exports = function (RED) {
    "use strict";

    const fs = require('fs');
    const util = require('../lib/util.js');

    function FilePassNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global
        node.islogic = config.islogic || false;

        node.on('input', function (msg) {
            var inp = '';
            inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

            // normalize the path by removing whitespaces on the left and right
            inp = inp.replace(/\s+$/, '');
            inp = inp.replace(/^\s+/, '');

            node.status({});

            // augment the result
            msg.passFilename = inp;

            // check if file exists
            fs.access(inp, fs.F_OK || fs.R_OK, function (err) {
                var pass = false;
                if (err) {
                    pass = false;
                } else {
                    pass = true;
                }

                if (pass) {
                    util.statusOk(node, "Exists");
                } else {
                    util.statusFail(node, "Not Exists");
                }

                if (node.islogic) {
                    // on logic mode - we always pass the value
                    // but we add flag to msg to indicate the logic state
                    msg.logic = (pass) ? 1 : 0;
                    node.send(msg);
                    return;
                }

                if (pass) {
                    node.send(msg);
                    return;
                }
                node.send(null);
            });
        });

        this.on("close", function () {
            node.status({});
        });
    }

    // !Register
    RED.nodes.registerType("file-pass", FilePassNode);
};
