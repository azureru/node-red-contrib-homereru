module.exports = function(RED) {
    "use strict";

    var fs = require('fs');

    function FilePassNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;

        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global

        node.on('input', function (msg) {
            var inp = '';
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
                case 'str':
                  inp = node.input;
                  break;
                default:
                  inp = node.input;
              }
            } catch (err) {
              inp = node.input;
              node.warn('Input property, ' + node.inputType + '.' + node.input + ', does NOT exist.');
            }

            // normalize the path by removing whitespaces on the left and right
            inp = inp.replace(/\s+$/,'');
            inp = inp.replace(/^\s+/,'');

            node.status({});
            fs.access(inp, fs.F_OK || fs.R_OK , function(err) {
                if (err) {
                    node.status({fill: 'red', shape: 'dot', text: 'Not Exists'});
                    node.send(null);
                } else {
                    node.status({fill: 'green', shape: 'ring', text: 'Exists'});
                    node.send(msg);
                }
            });
        });

        this.on("close", function() {
            node.status({});
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("file-pass", FilePassNode);

};
