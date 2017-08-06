module.exports = function (RED) {

	function CenInputNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		 // Retrieve the config node
        this.server = RED.nodes.getNode(config.server);
	}

	RED.nodes.registerType('cen-input', CenInputNode);
};
