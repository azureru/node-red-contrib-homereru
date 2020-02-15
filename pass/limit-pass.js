/**
 * based on https://raw.githubusercontent.com/nidayand/node-red-contrib-norelite/ nrl-limit
 * modified for generic usage
 **/

module.exports = function (RED) {
    "use strict";

    const util = require('../lib/util.js');
    const _ = require('underscore');

    function HmrLimitNode(config) {
        RED.nodes.createNode(this, config);

        // rate is in interval / how many (e.g. 2 messages / second = 1000 / 2)
        this.rateUnits = config.rateUnits;
        if (config.rateUnits === "minute") {
            this.rate = (60 * 1000) / config.rate;
        } else if (config.rateUnits === "hour") {
            this.rate = (60 * 60 * 1000) / config.rate;
        } else if (config.rateUnits === "day") {
            this.rate = (24 * 60 * 60 * 1000) / config.rate;
        } else { // Default to seconds
            this.rate = 1000 / config.rate;
        }

        this.name = config.name;
        this.buffer = [];
        this.intervalID = -1;
        let node = this;

        this.on("input", function (msg) {
            let content = _.extend(msg, {});

            /* Check if there is a buffer and there has been a different
               earlier in the queue that differs from incoming
               and if that is the case, simply drop that message */
            if (node.buffer.length > 0) {
                let foundIndex = 0;
                do {
                    foundIndex = _.findIndex(node.buffer, function (obj) {
                        if (msg.payload == obj.payload) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    if (foundIndex !== -1) {
                        //Remove the item
                        node.buffer.splice(foundIndex, 1);
                        if (node.buffer.length === 0) {
                            node.status({});
                        } else {
                            util.statusProgress(node, node.buffer.length);
                        }
                    }
                } while (foundIndex !== -1 && node.buffer.length > 0);
            }

            //Same as in the delay node
            if (node.intervalID !== -1) {
                node.buffer.push(content);
                util.statusProgress(node, node.buffer.length);
                if (node.buffer.length > 1000) {
                    node.warn(this.name + " " + RED._("delay.error.buffer"));
                }
            } else {
                node.send(msg);
                node.intervalID = setInterval(function () {
                    if (node.buffer.length === 0) {
                        clearInterval(node.intervalID);
                        node.intervalID = -1;
                        node.status({});
                    }

                    if (node.buffer.length > 0) {
                        node.send(node.buffer.shift());
                        util.statusProgress(node, node.buffer.length);
                    }
                }, node.rate);
            }

        });

        this.on("close", function () {
            clearInterval(node.intervalID);
            node.buffer = [];
            node.idList = [];
            node.intervalID = -1;
            node.lastSent = null;
        });
    }

    // !Register
    RED.nodes.registerType("limit-pass", HmrLimitNode);
};
