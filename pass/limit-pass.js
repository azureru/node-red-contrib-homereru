/**
 * based on https://raw.githubusercontent.com/nidayand/node-red-contrib-norelite/ nrl-limit
 * modified for generic usage
 **/

module.exports = function(RED) {
  "use strict";

  var MILLIS_TO_NANOS = 1000000;
  var SECONDS_TO_NANOS = 1000000000;
  var _ = require('underscore');

  function HmrLimitNode(n) {
    RED.nodes.createNode(this, n);

    this.rateUnits = n.rateUnits;

    if (n.rateUnits === "minute") {
      this.rate = (60 * 1000) / n.rate;
    } else if (n.rateUnits === "hour") {
      this.rate = (60 * 60 * 1000) / n.rate;
    } else if (n.rateUnits === "day") {
      this.rate = (24 * 60 * 60 * 1000) / n.rate;
    } else { // Default to seconds
      this.rate = 1000 / n.rate;
    }

    this.name = n.name;
    this.idList = [];
    this.buffer = [];
    this.intervalID = -1;
    this.lastSent = null;
    var node = this;

    this.on("input", function(msg) {

      /* Check if there is a buffer and there has been a different earlier in the queue that differs from incloming
      and if that is the case, simply drop that message */
      if (node.buffer.length > 0) {
        do {
          var foundIndex = _.findIndex(node.buffer, function(obj) {
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
              node.status({
                text: node.buffer.length
              });
            }
          }

        } while (foundIndex !== -1 && node.buffer.length > 0);
      }

      //Same as in the delay node
      if (node.intervalID !== -1) {
        node.buffer.push(msg);
        if (node.buffer.length > 0) {
          node.status({
            text: node.buffer.length
          });
        }
        if (node.buffer.length > 1000) {
          node.warn(this.name + " " + RED._("delay.error.buffer"));
        }
      } else {
        node.send(msg);
        node.intervalID = setInterval(function() {
          if (node.buffer.length === 0) {
            clearInterval(node.intervalID);
            node.intervalID = -1;
            node.status({});
          }

          if (node.buffer.length > 0) {
            node.send(node.buffer.shift());
            node.status({
              text: node.buffer.length
            });
          }
        }, node.rate);
      }

    });

    this.on("close", function() {
      clearInterval(node.intervalID);
      node.buffer = [];
      node.idList = [];
      node.intervalID = -1;
      node.lastSent = null;
    });
  }
  RED.nodes.registerType("limit-pass", HmrLimitNode);
}
