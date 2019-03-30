module.exports = function (RED) {
    "use strict";

    var util = require('../lib/util.js');

    function RangePassNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global

        node.from = config.from;
        node.to = config.to;
        node.islogic = config.islogic || false;

        node.on('input', function (msg) {
            var inp = '';
            inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

            // since this is a range pass - always convert to integer
            var intVal = parseInt(inp);

            var pass = false;
            if (intVal >= node.from && intVal <= node.to) {
                pass = true;
            }

            // augment the result
            msg.passValue = intVal;

            if (pass) {
                util.statusOk(node, intVal);
            } else {
                util.statusFail(node, intVal);
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

        this.on("close", function () {
            node.status({});
        });
    }

    // !Register
    RED.nodes.registerType("range-pass", RangePassNode);
};
