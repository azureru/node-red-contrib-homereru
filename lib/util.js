const moment = require('moment-timezone');

// parseMsg parse the usual property `input` type
const parseMsg = function (RED, node, inputType, input, msg) {
    let inp = '';
    try {
        switch (inputType) {
            case 'msg':
                inp = RED.util.getMessageProperty(msg, input);
                break;
            case 'flow':
                inp = node.context().flow.get(input);
                break;
            case 'global':
                inp = node.context().global.get(input);
                break;
            case 'str':
                inp = input;
                break;
            case 'date':
                inp = moment();
                break;
            default:
                inp = input;
        }
    } catch (err) {
        inp = input;
        node.warn(err);
    }
    return inp;
};

// parseTimeUnit to convert rate-rateUnit to proper interval in seconds
const parseTimeUnit = function (rate, rateUnits) {
    let result = 0;
    if (rateUnits === "minute") {
        result = (60 * 1000) * rate;
    } else if (rateUnits === "hour") {
        result = (60 * 60 * 1000) * rate;
    } else if (rateUnits === "day") {
        result = (24 * 60 * 60 * 1000) * rate;
    } else { // Default to seconds
        result = 1000 * rate;
    }
    return result;
};

// statusOk to show green dot to indicate OK
const statusOk = function (node, value) {
    node.status({
        fill: 'green',
        shape: 'dot',
        text: value
    });
};

// statusFail to show red dot to indicate failure
const statusFail = function (node, value) {
    node.status({
        fill: 'red',
        shape: 'dot',
        text: value
    });
};

// statusProgress to show blue ring to indicate progress
const statusProgress = function (node, value) {
    node.status({
        fill: 'blue',
        shape: 'ring',
        text: value
    });
};

// statusNeutral to show neutral status
const statusNeutral = function (node, value) {
    node.status({
        fill: 'grey',
        shape: 'ring',
        text: value
    });
};

module.exports = {
    // statuses
    statusOk: statusOk,
    statusFail: statusFail,
    statusProgress: statusProgress,
    statusNeutral: statusNeutral,

    // parsers
    parseMsg: parseMsg,
    parseTimeUnit: parseTimeUnit
};
