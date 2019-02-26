// Taken from
// https://raw.githubusercontent.com/centrifugal/jscent/master/lib/token.js
// see ./centrifugo.js for why

var crypto = require('crypto');

/** Verifies and signs data against secret.
 *
 * @constructor
 * @param {String} secret app secret
 */
function Token(secret) {
	this.secret = secret;
}

/** Signs the string using the secret.
 *
 * @param {String} string
 * @returns {String}
 */
Token.prototype.apiSign = function (string) {
	return crypto.createHmac('sha256', this.secret)
		.update(Buffer.from(string, 'utf-8'))
		.digest('hex');
};

/** Generate sign to subscribe on private channel.
 *
 * @param {String} client
 * @param {String} channel
 * @param {String} [info]
 * @returns {String}
 */
Token.prototype.channelSign = function (client, channel, info) {
	info = info || "";
	return crypto.createHmac('sha256', this.secret)
		.update(Buffer.from(client, 'utf-8'))
		.update(Buffer.from(channel, 'utf-8'))
		.update(Buffer.from(info, 'utf-8'))
		.digest('hex');
};


/** Generates client connection token.
 *
 * @param {String} user
 * @param {String} timestamp
 * @param {String} [info]
 * @returns {String}
 */
Token.prototype.clientToken = function (user, timestamp, info) {
	info = info || "";
	return crypto.createHmac('sha256', this.secret)
		.update(Buffer.from(user, 'utf-8'))
		.update(Buffer.from(timestamp, 'utf-8'))
		.update(Buffer.from(info, 'utf-8'))
		.digest('hex');
};

module.exports = Token;
