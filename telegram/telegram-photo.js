module.exports = function(RED) {
  "use strict";

  function TelegramPhotoNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Retrieve the config node
    this.server = RED.nodes.getNode(config.server);
    if (this.server) {
      this.on('close', function(done) {
        // call when node is shutdown
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
      try {
        switch (node.chatIdType) {
          case 'msg':
            chatId = RED.util.getMessageProperty(msg, node.chatId);
            break;
          case 'flow':
            chatId = node.context().flow.get(node.chatId);
            break;
          case 'global':
            chatId = node.context().global.get(node.chatId);
            break;
          case 'str':
            chatId = node.chatId;
            break;
          default:
            chatId = node.chatId;
        }
      } catch (err) {
        chatId = node.chatId;
        node.warn('Input property, ' +
          node.chatIdType + '.' +
          node.chatId + ', does NOT exist.');
      }
      var message = '';
      try {
        switch (node.messageType) {
          case 'msg':
            message = RED.util.getMessageProperty(msg, node.message);
            break;
          case 'flow':
            message = node.context().flow.get(node.message);
            break;
          case 'global':
            message = node.context().global.get(node.message);
            break;
          case 'str':
            message = node.message;
            break;
          default:
            message = node.message;
        }
      } catch (err) {
        message = node.message;
        node.warn('Input property, ' +
          node.messageType + '.' +
          node.message + ', does NOT exist.');
      }

      // send the photo
      this.server.bot.sendPhoto(chatId, message);
      msg.chatId = chatId;
      msg.message = message;
      node.send(msg);
    });

  }

  RED.nodes.registerType("telegram-photo", TelegramPhotoNode);
}
