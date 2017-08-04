module.exports = function(RED) {
    "use strict";

    function StringCommandNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        this.input = config.input || 'payload'; // where to take the input from
        this.inputType = config.inputType || 'msg'; // msg, flow or global

        this.modeType = config.modeType || 'delimiter';
        this.delimiter = config.delimiter || ' ';

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;

        // respond to inputs....
        this.on('input', function (msg) {
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

          var outputMessage = msg;
          outputMessage._internalMsg = {};
          switch (node.modeType) {
          	case "delimiter":
          		var arr = inp.split(node.delimiter);
          		if (arr.length > 0) {
          			outputMessage._internalMsg['command'] = arr[0];
          			for (var i = 0; i < arr.length; i++) {
          				outputMessage._internalMsg['' + i] = arr[i];
          			}
          		}
          	break;
          	case "query":
          	break;
          	case "chat":
          	break;
          }
          node.send(outputMsg);
        });
    }

    RED.nodes.registerType("string-command",StringCommandNode);
}
