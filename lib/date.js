const moment = require('moment-timezone');

/**
 * Convert date input from multiple source to a `moment` object
 *
 * @param {object} node      The node context itself
 * @param {object} msg       The Msg object
 * @param {string} inputType Input Type (msg, flow, global, string etc)
 * @param {string} input     Prefix or the input itself
 * @param {string} timeZone  Timezone

 * @return {string}
 */
var parseDateInput = function (node, msg, inputType, input, timeZone) {
    // when not specified - use UTC as default TZ
    if (timeZone === '') {
        timeZone = 'UTC';
    }

    // input is not specified - use default
    if (input === '') {
        return moment.tz(new Date(), timeZone);
    }

    var inp = '';
    try {
        if (inputType === 'msg') {
            inp = msg[input];
        } else if (inputType === 'flow') {
            inp = node.context().flow.get(node.input);
        } else if (inputType === 'global') {
            inp = node.context().global.get(node.input);
        } else if (inputType === 'date') {
            return moment.tz(new Date(), timeZone);
        } else {
            return moment.tz(new Date(), timeZone);
        }
    } catch (err) {
        node.warn('Error on parsing date ', err);
        return moment.tz(new Date(), timeZone);
    }

    if (typeof inp === 'number') {
        return moment.tz(inp, 'x', node.inTz);
    } else if (typeof inp === 'string') {
        return moment.tz(inp, node.inTz);
    }

    node.warn('Error on parsing date ', err);
    return moment.tz(new Date(), timeZone);
};

module.exports = {
    parseDateInput: parseDateInput
};
