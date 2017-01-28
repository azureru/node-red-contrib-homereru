/**
 * based on norelite code
 * https://github.com/nidayand/norelite
 **/

module.exports = function(RED) {
    "use strict";

    var moment = require('moment-timezone');

    // The main node definition - most things happen in here
    function DayPassNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;
        node.d1 = config.d1;
        node.d2 = config.d2;
        node.d3 = config.d3;
        node.d4 = config.d4;
        node.d5 = config.d5;
        node.d6 = config.d6;
        node.d7 = config.d7;
        node.inTz = config.inTz;

        node.on('input', function (msg) {
            var inp = moment.tz(new Date(), node.inTz);
            var day = inp.isoWeekday();
            var pass = false;

            var sDay = '';
            switch (day) {
                case 1:
                    pass = node.d1;
                    sDay = "Mon";
                break;
                case 2:
                    pass = node.d2;
                    sDay = "Tue";
                break;
                case 3:
                    pass = node.d3;
                    sDay = "Wed";
                break;
                case 4:
                    pass = node.d4;
                    sDay = "Thu";
                break;
                case 5:
                    pass = node.d5;
                    sDay = "Fri";
                break;
                case 6:
                    pass = node.d6;
                    sDay = "Sat";
                break;
                case 7:
                    pass = node.d7;
                    sDay = "Sun";
                break;
            }

            if (pass) {
                node.status({fill: 'green', shape: 'ring', text: sDay});
                node.send(msg);
                return;
            }

            // not within bounds - do nothing
            node.status({fill: 'red', shape: 'dot', text: sDay});
            node.send(null);
        });

        this.on("close", function() {
            node.status({});
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("day-pass",DayPassNode);

};