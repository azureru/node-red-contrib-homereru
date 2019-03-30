module.exports = function(RED) {
  "use strict";

  var util = require('../lib/util.js');

  function TelegramMessageNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    // Retrieve the config node
    this.server = RED.nodes.getNode(config.server);
    if (this.server) {
      this.on('close', function(done) {
        // call when node is shutdown
        done();
      });
    } else {
      this.error('No Server Configuration');
    }

    node.chatId = config.chatId || 'payload'; // where to take the input from
    node.chatIdType = config.chatIdType || 'msg'; // msg, flow or global
    node.message = config.message || 'payload'; // where to take the input from
    node.messageType = config.messageType || 'msg'; // msg, flow or global

    this.on('input', function(msg) {
      var chatId = '';
      chatId = util.parseMsg(RED, node, node.chatIdType, node.chatId, msg);

      var message = '';
      message = util.parseMsg(RED, node, node.messageType, node.message, msg);

      // send the message
      this.server.bot.sendMessage(chatId, message);
      msg.chatId = chatId;
      msg.message = message;
      node.send(msg);
    });
  }

  // !Register
  RED.nodes.registerType("telegram-message", TelegramMessageNode);
}
