module.exports = function (RED) {

	var status;
	var token;
	var client;
	var Centrifuge = require('./lib/centrifuge.js');
	var Token = require('./lib/token.js');

	function CentrifugeConfigNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		node.users = {};
		node.host = config.host;
		node.user = config.user;
		node.secret = node.credentials.secret;
		node.info = "";
		var subscriptions = {};

		var timestamp = Math.round(new Date().getTime() / 1000);
		var tokenize = new Token(node.secret);
		var clientToken = tokenizer.clientToken(node.user, ""+timestamp, node.info);

		var client = new Centrifuge({
			url: host,
			user: node.user,
			timestamp: timestamp
			info: node.info
			token: clientToken
		});
		client.on('connecting', function () {
			node.setStatus('connecting');
		});
		client.on('connect', function () {
			node.setStatus('connect');
			node.connected = true;

			Object.keys(subscriptions).forEach(function (channel) {
				client.subscribe(channel, function (err, res) {
					node.subscriptionHandler(channel, err, res);
				});
			});

			node.emit('tvconnect');
		});
		client.on('error', function (e) {
			node.connected = false;
			node.setStatus(e.code);
		});
		client.on('close', function () {
			node.emit('tvclose');
			node.connected = false;
			node.setStatus('close');
		});
		centrifuge.connect();

		this.subscriptionHandler = function (channel, err, res) {
			if (subscriptions[channel]) {
				Object.keys(subscriptions[channel]).forEach(function (id) {
					subscriptions[channel][id](err, res);
				});
			}
		};

		this.subscribe = function (id, channel, callback) {
			if (!subscriptions[channel]) {
				subscriptions[channel] = {};
				if (node.connected) {
					client.subscribe(channel, function (err, res) {
						node.subscriptionHandler(channel, err, res);
					});
				}
			}
			subscriptions[channel][id] = callback;
		};

		this.register = function (clientNode) {
			node.users[clientNode.id] = clientNode;
		};

		this.deregister = function (clientNode, done) {
			delete node.users[clientNode.id];
			Object.keys(subscriptions).forEach(function (channel) {
				delete subscriptions[channel][clientNode.id];
			});
			return done();
		};

		this.setStatus = function (c) {
			status = c;
			var s;
			switch (c) {
				case 'connecting':
					s = {
						fill: 'yellow',
						shape: 'ring',
						text: 'node-red:common.status.connecting'
					};
					break;
				case 'prompt':
					s = {
						fill: 'yellow',
						shape: 'ring',
						text: c
					};
					break;
				case 'connect':
					s = {
						fill: 'green',
						shape: 'dot',
						text: 'node-red:common.status.connected'
					};
					break;
				case 'disconnected':
					s = {
						fill: 'red',
						shape: 'ring',
						text: 'node-red:common.status.disconnected'
					};
					break;
				default:
					s = {
						fill: 'red',
						shape: 'ring',
						text: c
					};
			}

			Object.keys(node.users).forEach(function (id) {
				node.users[id].status(s);
			});
		};
	}

	RED.nodes.registerType('cen-config', CentrifugeConfigNode, {
		credentials: {
			secret: {type: 'text'}
		}
	});
};
