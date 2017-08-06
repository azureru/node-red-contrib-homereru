module.exports = function (RED) {

	function CenInputNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		 // Retrieve the config node
        this.server = RED.nodes.getNode(config.server);

        if (this.server) {
        	this.server.register(node);
			this.on('close', function (done) {
				node.server.deregister(node, done);
			});
        } else {
        	this.error('No Server Configuration');
        }

		this.on("input", function(msg) {
            this.send(msg);
        });
	}

	RED.nodes.registerType('cen-input', CenInputNode);
};
