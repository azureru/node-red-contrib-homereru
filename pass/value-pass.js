module.exports = function(RED) {
    "use strict";

    function ValuePassNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;

        node.input = config.input || 'payload'; // where to take the input from
        node.inputType = config.inputType || 'msg'; // msg, flow or global

        node.from = config.from;
        node.to = config.to;

        node.on('input', function (msg) {
            var inp = '';
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

            var intVal = parseInt(inp);

            var pass = false;
            if (intVal >= node.from && intVal <= node.to) {
                pass = true;
            }

            if (pass) {
                node.status({fill: 'green', shape: 'ring', text: intVal});
                node.send(msg);
                return;
            }

            // not within bounds - do nothing
            node.status({fill: 'red', shape: 'dot', text: intVal});
            node.send(null);
        });

        this.on("close", function() {
            node.status({});
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("value-pass",ValuePassNode);

};
