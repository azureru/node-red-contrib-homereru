/**
 * Basically code from https://github.com/totallyinformation/node-red-contrib-moment
 * With minor adjustment
 */
module.exports = function (RED) {
    "use strict";

    const util = require('../lib/util.js');
    const moment = require('moment-timezone');
    const osLocale = require('os-locale');
    const hostTz = moment.tz.guess();
    const hostLocale = osLocale.sync();

    // The main node definition - most things happen in here
    function DateLocaleNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;
        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global
        node.fakeUTC = config.fakeUTC || false; // is the input UTC rather than local date/time?

        node.adjAmount = config.adjAmount || 0; // number
        node.adjType = config.adjType || 'days'; // days, hours, etc.
        node.adjDir = config.adjDir || 'add'; // add or subtract

        node.inFormat = config.inFormat || ''; // valid moment.js format string
        node.outFormat = config.outFormat || ''; // valid moment.js format string

        node.inTz = config.inTz || false; // timezone, '' or zone name, e.g. Europe/London
        node.outTz = config.outTz || node.inTz; // timezone, '' or zone name, e.g. Europe/London

        // respond to inputs....
        node.on('input', function (msg) {

            if (node.topic !== '') {
                msg.topic = node.topic;
            }

            var inp = util.parseMsg(RED, node, node.inputType, node.input, msg);
            if (typeof inp === 'number') {
                inp = '' + inp;
            }

            // if inp is still a string
            if ((typeof inp) === 'string') {
                inp = inp.trim();
                // Some string input hacks
                switch (inp.toLowerCase()) {
                    case 'today':
                        inp = moment();
                        break;
                    case 'yesterday':
                        inp = moment();
                        inp.subtract(1, 'days');
                        break;
                    case 'tomorrow':
                        inp = moment();
                        inp.add(1, 'days');
                        break;
                    default:
                        if (node.inFormat !== '') {
                            inp = moment.tz(inp, node.inFormat, node.inTz);
                        } else {
                            inp = moment.tz(inp, node.inTz);
                        }
                }
            }

            // off-setting
            if (node.adjAmount !== 0) {
                if (isMeasureValid(node.adjType)) {
                    if (node.adjDir === 'subtract') {
                        inp.subtract(node.adjAmount, node.adjType);
                    } else {
                        inp.add(node.adjAmount, node.adjType);
                    }
                } else {
                    // it isn't valid so warn and don't adjust
                    node.warn('Offset measure type not valid, no offset made');
                }
            }

            // If required, change to the output Timezone
            if (node.outTz !== '') inp.tz(node.outTz);

            // Check if the input is a date?
            var outputMsg = msg;
            if (!inp.isValid()) {
                node.warn('The input property was NOT a recognisable date. Output will be a blank string');
                outputMsg.payload = '';
            } else {
                // If format not set, assume ISO8601 string if input is a Date otherwise assume Date
                switch (node.outFormat.toLowerCase()) {
                    case '':
                    case 'iso8601':
                    case 'iso':
                        // Default to ISO8601 string
                        outputMsg.payload = inp.toISOString();
                        break;
                    case 'mysql':
                        // Default to ISO8601 string
                        outputMsg.payload = inp.format('YYYY-MM-DD');
                        break;
                    case 'fromnow':
                    case 'timeago':
                    case 'humane':
                        // We are also going to handle time-from-now (AKA time ago) format
                        outputMsg.payload = inp.fromNow();
                        break;
                    case 'calendar':
                    case 'aroundnow':
                        // We are also going to handle calendar format (AKA around now)
                        // Force dates >1 week from now to be in ISO instead of US format
                        outputMsg.payload = inp.calendar(null, {sameElse: 'YYYY-MM-DD'});
                        break;
                    case 'date':
                    case 'jsdate':
                        // return js object Date()
                        outputMsg.payload = inp.toDate();
                        break;
                    case 'object':
                        // return js object JSON
                        outputMsg.payload = inp.toObject();
                        // momentjs give months 0..11
                        outputMsg.payload.months += 1;
                        // add additional info
                        outputMsg.payload.dow = inp.isoWeekday();
                        outputMsg.payload.doy = inp.dayOfYear();
                        break;
                    default:
                        outputMsg.payload = inp.format(node.outFormat);
                }
            }

            // Send the output message
            util.statusOk(node, inp.format("YYYY-MM-DD HH:mm Z"));
            node.send(outputMsg);
        });
    }

    function isMeasureValid(adjType) {
        let validTypes = ['years', 'y', 'quarters', 'Q', 'months', 'M', 'weeks', 'w', 'days', 'd', 'hours', 'h', 'minutes', 'm', 'seconds', 's', 'milliseconds', 'ms'];
        return validTypes.indexOf(adjType) > -1;
    }

    // !Register
    RED.nodes.registerType("date-locale", DateLocaleNode);
    RED.httpAdmin.get("/hmr-api/moment", RED.auth.needsPermission('moment.read'), function (req, res) {
        res.json({
            "tz": hostTz,
            "locale": hostLocale
        });
    });
};
