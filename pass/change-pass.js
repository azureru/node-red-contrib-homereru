module.exports = function (RED) {
    "use strict";

    const util = require('../lib/util.js');

    function ChangePassNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        this.rateUnits = config.rateUnits;
        this.rate = util.parseTimeUnit(config.rate, config.rateUnits);

        node.intervalId = -1;
        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global
        node.previousValue = "";
        node.islogic = config.islogic || false;

        node.on('input', function (msg) {
            var inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

            var pass = false;
            var value = inp;

            // check `pass` logic based on delta of value-previousValue
            if (value != node.previousValue) {
                pass = true;
                node.previousValue = value;
            }

            // no interval specified yet - create interval to reset cache
            if (node.intervalId === -1) {
                if (node.rate != 0) {
                    node.intervalId = setInterval(function () {
                        // clear
                        node.previousValue = null;
                        node.status({});
                    }, node.rate);
                }
            }

            // augment the result
            msg.passValue = value;

            if (pass) {
                util.statusOk(node, value);
            } else {
                util.statusFail(node, value);
            }

            if (node.islogic) {
                // on logic mode - we always pass the value
                // but we add property `logic` to msg to indicate the logic state
                msg.logic = (pass) ? 1 : 0;
                node.send(msg);
                return;
            }

            // when not a logic mode - we only continue to next
            // node if the condition is passed
            if (pass) {
                node.send(msg);
                return;
            }
            node.send(null);
        });

        this.on("close", function () {
            node.status({});
            clearInterval(node.intervalId);
            node.intervalId = -1;
        });
    }

    // !Register
    RED.nodes.registerType("change-pass", ChangePassNode);
};
