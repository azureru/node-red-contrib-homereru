/**
 * based on norelite code
 * https://github.com/nidayand/norelite
 **/

module.exports = function(RED) {
  "use strict";

  var dateUtil = require('../lib/date.js');
  var util = require('../lib/util.js');

  function DayPassNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    node.input = config.input || 'date'; // where to take the input from
    node.inputType = config.inputType || 'msg'; // msg, flow or global
    node.islogic = config.islogic || false;

    node.d1 = config.d1;
    node.d2 = config.d2;
    node.d3 = config.d3;
    node.d4 = config.d4;
    node.d5 = config.d5;
    node.d6 = config.d6;
    node.d7 = config.d7;
    node.inTz = config.inTz;

    node.on('input', function(msg) {

      var inp = dateUtil.parseDateInput(
        node, msg, node.inputType, node.input, node.inTz);
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
        util.statusOk(node, sDay);
      } else {
        util.statusFail(node, sDay);
      }

      if (node.islogic) {
          // on logic mode - we always pass the value
          // but we add flag to msg to indicate the logic state
          msg.logic = (pass) ? 1 : 0;
          node.send(msg);
          return;
      }

      // not logic mode - only move to next node when pass
      if (pass) {
        node.send(msg);
        return;
      }
      node.send(null);
    });

    this.on("close", function() {
      node.status({});
    });
  }

  // !Register
  RED.nodes.registerType("day-pass", DayPassNode);
};
