module.exports = function(RED) {
  "use strict";

  var util = require('../lib/util.js');

  function RangePassNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    node.input = config.input || 'payload'; // where to take the input from
    node.inputType = config.inputType || 'msg'; // msg, flow or global

    node.from = config.from;
    node.to = config.to;

    node.on('input', function(msg) {
      var inp = '';
      inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

      // since this is a range pass - always convert to integer
      var intVal = parseInt(inp);

      var pass = false;
      if (intVal >= node.from && intVal <= node.to) {
        pass = true;
      }

      if (pass) {
        util.statusOk(node, intVal);
        node.send(msg);
        return;
      }

      // not within bounds - do nothing
      util.statusFail(node, intVal);
      node.send(null);
    });

    this.on("close", function() {
      node.status({});
    });
  }

  // !Register
  RED.nodes.registerType("range-pass", RangePassNode);
};
