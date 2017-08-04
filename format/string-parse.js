module.exports = function(RED) {
    "use strict";

    var qs = require('querystring');

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
                  inp = RED.util.getMessageProperty(msg, node.input);
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
          outputMessage.parsed = {};
          switch (node.modeType) {
          	case "delimiter":
          		var arr = inp.split(node.delimiter);
          		if (arr.length > 0) {
          			outputMessage.parsed['command'] = arr[0];
          			var wholeMessage = '';
          			for (var i = 0; i < arr.length; i++) {
          				outputMessage.parsed['' + i] = arr[i];
          				if (i>0) {
          					wholeMessage += node.delimiter+arr[i];
          				}
          			}
          			outputMessage.command = arr[0];
          			outputMessage.param = wholeMessage.trim();
          			outputMessage.all = inp;
          		}
          	break;
          	case "query":
          		outputMessage.parsed = qs.parse(inp);
        			outputMessage.command = '';
        			outputMessage.all = inp;
          	break;
          	case "chat":
          		var arr = inp.split(node.delimiter);
          		if (arr.length > 0) {
          			outputMessage.parsed['command'] = arr[0].replace('/', '');
          			var wholeMessage = '';
          			for (var i = 0; i < arr.length; i++) {
          				outputMessage.parsed['' + i] = arr[i];
          				if (i>0) {
          					wholeMessage += node.delimiter+arr[i];
          				}
          			}
          			wholeMessage = wholeMessage.trim();
          			// parsed[0] is all string after `/command`
          			outputMessage.parsed['0'] = wholeMessage;
		      			outputMessage.command = outputMessage.parsed['command'];
		      			outputMessage.param = wholeMessage;
		      			outputMessage.all = inp;
          		}
          	break;
          }
          node.send(outputMessage);
        });
    }

    RED.nodes.registerType("str-parse",StringCommandNode);
}
