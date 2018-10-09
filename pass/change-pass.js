module.exports = function(RED) {
  "use strict";

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

    node.on('input', function(msg) {
      var inp = '';
      try {
        switch (node.inputType) {
          case 'msg':
            inp = RED.util.getMessageProperty(msg, node.input);
            break;
          case 'flow':
            inp = node.context().flow.get(node.input);
            break;
          case 'global':
            inp = node.context().global.get(node.input);
            break;
          case 'str':
            inp = node.input;
            break;
          default:
            inp = node.input;
        }
      } catch (err) {
        inp = node.input;
        node.warn('Input property, ' +
          node.inputType + '.' +
          node.input + ', does NOT exist.');
      }

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

      if (pass) {
        node.status({
          fill: 'green',
          shape: 'ring',
          text: value
        });
        node.send(msg);
        return;
      }

      node.status({
        fill: 'red',
        shape: 'dot',
        text: value
      });
      node.send(null);
    });

    this.on("close", function() {
      node.status({});
      clearInterval(node.intervalId);
      node.intervalId = -1;
    });
  }

  RED.nodes.registerType("change-pass", ChangePassNode);
};
