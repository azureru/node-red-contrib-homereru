module.exports = function(RED) {
  "use strict";

  var util = require('../lib/util.js');

  function ChangePassNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    this.rateUnits = config.rateUnits;

    if (config.rateUnits === "minute") {
      this.rate = (60 * 1000) * config.rate;
    } else if (config.rateUnits === "hour") {
      this.rate = (60 * 60 * 1000) * config.rate;
    } else if (config.rateUnits === "day") {
      this.rate = (24 * 60 * 60 * 1000) * config.rate;
    } else { // Default to seconds
      this.rate = 1000 * config.rate;
    }

    node.intervalId = -1;
    node.input = config.input || 'payload'; // where to take the input from
    node.inputType = config.inputType || 'msg'; // msg, flow or global
    node.previousValue = "";
    node.islogic = config.islogic || false;

    node.on('input', function(msg) {
      var inp = '';

      inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

      var pass = false;
      var value = inp;
      // only pass if there's changes
      if (value != node.previousValue) {
        pass = true;
        node.previousValue = value;
      }

      // no interval specified yet - create interval to reset
      if (node.intervalId === -1) {
        if (node.rate != 0) {
          node.intervalId = setInterval(function() {
            // clear
            node.previousValue = null;
            node.status({});
          }, node.rate);
        }
      }

      if (node.islogic) {
          // on logic mode - we always pass the value
          // but we add flag to msg to indicate the logic state
          msg.logic = (pass) ? 1 : 0;
          util.statusOk(node, msg.logic);
          node.send(msg);
          return;
      }

      // is not a logic mode - we only continue to next
      // node if the condition is passed
      if (pass) {
        util.statusOk(node, value);
        node.send(msg);
        return;
      }

      util.statusFail(node, value);
      node.send(null);
    });

    this.on("close", function() {
      // clean
      node.status({});
      clearInterval(node.intervalId);
      node.intervalId = -1;
    });
  }

  RED.nodes.registerType("change-pass", ChangePassNode);
};
