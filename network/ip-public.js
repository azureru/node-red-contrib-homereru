module.exports = function(RED) {
  "use strict";

  var request = require('request');
  var util = require('../lib/util.js');

  function IpNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    node.on('input', function(msg) {
      var checkUrl = 'http://whatismyip.akamai.com/';
      var msg = {
        payload: ""
      };

      // send request to akamai to get public `ip`
      request(checkUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var ip = body;
          util.statusOk(ip);
          msg.payload = ip;
          node.send(msg);
        } else {
          node.send(null);
        }
      });

      return;
    });

    this.on("close", function() {
      node.status({});
    });
  }

  // !Register
  RED.nodes.registerType("ip-public", IpNode);
};
