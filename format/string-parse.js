module.exports = function (RED) {
    "use strict";

    const qs = require('querystring');
    const util = require('../lib/util.js');

    function StringCommandNode(config) {
        RED.nodes.createNode(this, config);

        this.input = config.input || 'payload'; // where to take the input from
        this.inputType = config.inputType || 'msg'; // msg, flow or global

        this.modeType = config.modeType || 'delimiter';
        this.delimiter = config.delimiter || ' ';

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;

        // respond to inputs....
        this.on('input', function (msg) {
            if (node.topic !== '') {
                msg.topic = node.topic;
            }

            var inp = util.parseMsg(RED, node, node.inputType, node.input, msg);

            // since this is a string parse - always treat as string
            if (typeof inp === 'number') {
                inp = '' + inp;
            }

            var outputMessage = msg;
            outputMessage.parsed = {};
            var wholeMessage = '';

            switch (node.modeType) {
                case "delimiter":
                    var arr = inp.split(node.delimiter);
                    if (arr.length > 0) {
                        outputMessage.parsed['command'] = arr[0];
                        for (var i = 0; i < arr.length; i++) {
                            outputMessage.parsed['' + i] = arr[i];
                            if (i > 0) {
                                wholeMessage += node.delimiter + arr[i];
                            }
                        }
                        outputMessage.command = arr[0];
                        outputMessage.param = wholeMessage.trim();
                        outputMessage.all = inp;
                    }
                    break;
                case "query":
                    if (typeof inp == "object") {
                        // this could happen if we use node-`http`-request
                        outputMessage.parsed = inp;
                    } else {
                        outputMessage.parsed = qs.parse(inp);
                    }
                    outputMessage.command = '';
                    outputMessage.all = inp;
                    break;
                case "chat":
                    var arr = inp.split(node.delimiter);
                    if (arr.length > 0) {
                        var cmd = arr[0];
                        var bot = "";
                        cmd = cmd.replace('/', '');
                        // found '@' - the command is a bot command /tv@botname
                        if (cmd.indexOf('@') != -1) {
                            var cmdSplit = cmd.split('@');
                            cmd = cmdSplit[0];
                            bot = cmdSplit[1];
                        }
                        outputMessage.parsed['command'] = cmd;
                        outputMessage.parsed['bot'] = bot;
                        for (var i = 0; i < arr.length; i++) {
                            outputMessage.parsed['' + i] = arr[i];
                            if (i > 0) {
                                wholeMessage += node.delimiter + arr[i];
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

    // !Register
    RED.nodes.registerType("str-parse", StringCommandNode);
};
