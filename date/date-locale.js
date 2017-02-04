/**
 * Basically code from https://github.com/totallyinformation/node-red-contrib-moment
 * With minor adjustment
 */
module.exports = function(RED) {
    "use strict";

    var moment      = require('moment-timezone');
    var osLocale    = require('os-locale');
    var hostTz      = moment.tz.guess();
    var hostLocale  = osLocale.sync();

    // The main node definition - most things happen in here
    function DateLocaleNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        this.input = config.input || 'payload'; // where to take the input from
        this.inputType = config.inputType || 'msg'; // msg, flow or global
        this.fakeUTC = config.fakeUTC || false; // is the input UTC rather than local date/time?

        this.adjAmount = config.adjAmount || 0; // number
        this.adjType = config.adjType || 'days'; // days, hours, etc.
        this.adjDir = config.adjDir || 'add'; // add or subtract

        this.inFormat = config.inFormat || ''; // valid moment.js format string
        this.outFormat = config.outFormat || ''; // valid moment.js format string

        this.inTz = config.inTz || false; // timezone, '' or zone name, e.g. Europe/London
        this.outTz = config.outTz || this.inTz; // timezone, '' or zone name, e.g. Europe/London

        var node = this;

        // respond to inputs....
        node.on('input', function (msg) {

          if ( node.topic !== '' ) {
            msg.topic = node.topic;
          }

          var inp = '';
          if ( node.input === '' ) {
            inp = moment();
          } else {
            // Otherwise, check which input type & get the input
            try {
              switch ( node.inputType ) {
                case 'msg':
                  inp = msg[node.input];
                  break;
                case 'flow':
                  inp = node.context().flow.get(node.input);
                  break;
                case 'global':
                  inp = node.context().global.get(node.input);
                  break;
                case 'date':
                  inp = moment();
                  break;
                case 'str':
                  inp = node.input.trim();
                  break;
                default:
                  inp = moment();
                  node.warn('Unrecognised Input Type, ' + node.inputType + '. Output has been set to NOW.');
              }
            } catch (err) {
              inp = moment();
              node.warn('Input property, ' + node.inputType + '.' + node.input + ', does NOT exist. Output has been set to NOW.');
            }
          }

          if (typeof inp === 'number') {
            inp = ''+ inp;
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
                if (this.inFormat !== '') {
                    inp = moment.tz(inp, node.inFormat, node.inTz);
                } else {
                    inp = moment.tz(inp, node.inTz);
                }
            }
          }

          // offseting
          if (node.adjAmount !== 0) {
            if (isMeasureValid(node.adjType)) {
              if ( node.adjDir === 'subtract') {
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
          if ( node.outTz !== '' ) inp.tz(node.outTz);

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
                outputMsg.payload = inp.calendar(null,{sameElse:'YYYY-MM-DD'});
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
          node.status({fill:"green",shape:"dot",text: inp.format("YYYY-MM-DD HH:mm Z")});
          node.send(outputMsg);
        });
    }

    function isMeasureValid(adjType)
    {
      var validTypes = ['years','y','quarters','Q','months','M','weeks','w','days','d','hours','h','minutes','m','seconds','s','milliseconds','ms'];
      return validTypes.indexOf(adjType) > -1;
    }

    RED.nodes.registerType("date-locale", DateLocaleNode);

    RED.httpAdmin.get("/hmr-api/moment", RED.auth.needsPermission('moment.read'), function(req,res) {
        res.json({
          "tz": hostTz,
          "locale": hostLocale
        });
    });
};