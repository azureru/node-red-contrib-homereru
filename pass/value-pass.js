module.exports = function(RED) {
    "use strict";

    function ValuePassNode(config) {
        // Create a RED node
        RED.nodes.createNode(this, config);

        var node = this;
        node.from = config.from;
        node.to = config.to;

        node.on('input', function (msg) {
            var val = msg.payload;
            var intVal = parseInt(val);

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