/**
 * based on norelite code
 * https://github.com/nidayand/norelite
 **/

module.exports = function(RED) {
    "use strict";

    var moment = require('moment-timezone');

    // The main node definition - most things happen in here
    function TimePassNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;
        node.from = config.from;
        node.to = config.to;
        node.inTz = config.inTz;

        var validate = function(v) {
            if (v.indexOf(":") == -1) {
                return false;
            }
            var time = v.split(":");
            if (time.length != 2) {
                return false;
            }
            var h = parseInt(time[0]);
            if (isNaN(h) || h < 0 || h > 23) {
                return false;
            }
            var m = parseInt(time[1]);
            if (isNaN(m) || m < 0 || m > 59) {
                return false;
            }
            return true;
        };

        var parseTime = function(v) {
            var time = v.split(":");
            var h = parseInt(time[0]);
            var m = parseInt(time[1]);
            return {
                hours : h,
                mins : m,
                totSecs : (h * 3600 + m * 60)
            };
        };

        node.isFromValid = validate(node.from);
        node.isToValid = validate(node.to);
        node.valid = node.isFromValid && node.isToValid;
        if (!node.valid) {
            if (!node.isFromValid) {
                node.warn("[From] field is invalid!");
            }
            if (!node.isToValid) {
                node.warn("[To] field is invalid!");
            }
            node.status({fill : "red", shape: "ring", text: "Invalid Config!"});
            node.error("Invalid Input");
        }

        node.from = parseTime(node.from);
        node.to = parseTime(node.to);

        node.on('input', function (msg) {
            var inp = moment.tz(new Date(), node.inTz);
            var ch = inp.hour();
            var cm = inp.minute();
            var toSec = ch * 3600 + cm * 60 + inp.second();

            var sTime = (ch < 10 ? "0" + ch : ch) + ":" + (cm < 10 ? "0" + cm : cm);
            var pass = false;
            if (node.from.totSecs < node.to.totSecs) {
                if (node.from.totSecs < toSec && toSec < node.to.totSecs) {
                    pass = true;
                } else {
                    pass = false;
                }
            } else {
                if (node.from.totSecs < toSec || toSec < node.to.totSecs) {
                    pass = true;
                } else {
                    pass = false;
                }
            }

            if (pass) {
                node.status({fill: 'green', shape: 'ring', text: sTime});
                node.send(msg);
            } else {
                // not within bounds - do nothing
                node.status({fill: 'red', shape: 'dot', text: sTime});
                node.send(null);
            }
        });

        this.on("close", function() {
            node.status({});
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("time-pass",TimePassNode);

};