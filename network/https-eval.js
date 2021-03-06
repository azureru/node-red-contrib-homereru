/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
    "use strict";

    const https = require("follow-redirects").https;
    const urlLib = require("url");
    const mustache = require("mustache");
    const querystring = require("querystring");
    const util = require('../lib/util.js');

    function HTTPRequest(n) {
        RED.nodes.createNode(this, n);

        var node = this;
        var nodeUrl = n.url;
        var isTemplatedUrl = (nodeUrl || "").indexOf("{{") !== -1;
        var nodeMethod = n.method || "GET";
        this.ret = n.ret || "txt";

        if (RED.settings.httpRequestTimeout) {
            this.reqTimeout = parseInt(RED.settings.httpRequestTimeout) || 120000;
        } else {
            this.reqTimeout = 120000;
        }

        var prox, noprox;
        if (process.env.http_proxy != null) {
            prox = process.env.http_proxy;
        }
        if (process.env.HTTP_PROXY != null) {
            prox = process.env.HTTP_PROXY;
        }
        if (process.env.no_proxy != null) {
            noprox = process.env.no_proxy.split(",");
        }
        if (process.env.NO_PROXY != null) {
            noprox = process.env.NO_PROXY.split(",");
        }

        this.on("input", function (msg) {
            var preRequestTimestamp = process.hrtime();
            util.statusProgress(node,"httpin.status.requesting");

            var url = nodeUrl || msg.url;
            if (msg.url && nodeUrl && (nodeUrl !== msg.url)) {
                // revert change below when warning is finally removed
                node.warn(RED._("node-red:common.errors.nooverride"));
            }
            if (isTemplatedUrl) {
                url = mustache.render(nodeUrl, msg);
            }
            if (!url) {
                node.error(RED._("node-red:httpin.errors.no-url"), msg);
                return;
            }
            // url must start https://
            if (!(url.indexOf("https://") === 0)) {
                url = "https://" + url;
            }

            var method = nodeMethod.toUpperCase() || "GET";
            if (msg.method && n.method && (n.method !== "use")) {
                // warn if override option not set
                node.warn(RED._("node-red:common.errors.nooverride"));
            }
            if (msg.method && n.method && (n.method === "use")) {
                // use the msg parameter
                method = msg.method.toUpperCase();
            }

            var opts = urlLib.parse(url);
            opts.method = method;
            opts.headers = {};
            opts.port = 443;
            opts.rejectUnauthorized = false;
            opts.agent = new https.Agent({
                keepAlive: false,
                maxCachedSessions: 0,
                rejectUnauthorized: false
            });
            var ctSet = "Content-Type"; // set default camel case
            var clSet = "Content-Length";
            if (msg.headers) {
                for (var v in msg.headers) {
                    if (msg.headers.hasOwnProperty(v)) {
                        var name = v.toLowerCase();
                        if (name !== "content-type" && name !== "content-length") {
                            // only normalise the known headers used later in this
                            // function. Otherwise leave them alone.
                            name = v;
                        } else if (name === 'content-type') {
                            ctSet = v;
                        } else {
                            clSet = v;
                        }
                        opts.headers[name] = msg.headers[v];
                    }
                }
            }
            if (this.credentials && this.credentials.user) {
                opts.auth =
                    this.credentials.user +
                    ":" +
                    (this.credentials.password || "");
            }
            var payload = null;

            if (msg.payload &&
                (method === "POST" || method === "PUT" || method === "PATCH")) {
                if (typeof msg.payload === "string" || Buffer.isBuffer(msg.payload)) {
                    payload = msg.payload;
                } else if (typeof msg.payload == "number") {
                    payload = msg.payload + "";
                } else {
                    if (opts.headers['content-type'] === 'application/x-www-form-urlencoded') {
                        payload = querystring.stringify(msg.payload);
                    } else {
                        payload = JSON.stringify(msg.payload);
                        if (opts.headers['content-type'] == null) {
                            opts.headers[ctSet] = "application/json";
                        }
                    }
                }
                if (opts.headers['content-length'] == null) {
                    if (Buffer.isBuffer(payload)) {
                        opts.headers[clSet] = payload.length;
                    } else {
                        opts.headers[clSet] = Buffer.byteLength(payload);
                    }
                }
            }
            // revert to user supplied Capitalisation if needed.
            if (opts.headers.hasOwnProperty('content-type') && (ctSet !==
                'content-type')) {
                opts.headers[ctSet] = opts.headers['content-type'];
                delete opts.headers['content-type'];
            }
            if (opts.headers.hasOwnProperty('content-length') && (clSet !==
                'content-length')) {
                opts.headers[clSet] = opts.headers['content-length'];
                delete opts.headers['content-length'];
            }
            var urltotest = url;
            var noproxy;
            if (noprox) {
                for (var i in noprox) {
                    if (url.indexOf(noprox[i]) !== -1) {
                        noproxy = true;
                    }
                }
            }
            if (prox && !noproxy) {
                var match = prox.match(/^(http:\/\/)?(.+)?:([0-9]+)?/i);
                if (match) {
                    //opts.protocol = "http:";
                    //opts.host = opts.hostname = match[2];
                    //opts.port = (match[3] != null ? match[3] : 80);
                    opts.headers['Host'] = opts.host;
                    var heads = opts.headers;
                    var path = opts.pathname = opts.href;
                    opts = urlLib.parse(prox);
                    opts.path = opts.pathname = path;
                    opts.headers = heads;
                    opts.method = method;
                    urltotest = match[0];
                } else {
                    node.warn("Bad proxy url: " + process.env.http_proxy);
                }
            }
            var req = https.request(opts, function (res) {
                (node.ret === "bin") ? res.setEncoding('binary') : res.setEncoding(
                    'utf8');
                msg.statusCode = res.statusCode;
                msg.headers = res.headers;
                msg.responseUrl = res.responseUrl;
                msg.payload = "";

                // add the `cert`
                msg.cert = res.socket.getPeerCertificate(false);
                if (msg.cert != null) {
                    delete msg.cert.raw;
                }

                res.on('data', function (chunk) {
                    msg.payload += chunk;
                });

                res.on('end', function () {
                    if (node.metric()) {
                        // Calculate request time
                        var diff = process.hrtime(preRequestTimestamp);
                        var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                        var metricRequestDurationMillis = ms.toFixed(3);
                        node.metric("duration.millis", msg, metricRequestDurationMillis);
                        if (res.client && res.client.bytesRead) {
                            node.metric("size.bytes", msg, res.client.bytesRead);
                        }
                    }

                    if (node.ret === "bin") {
                        msg.payload = Buffer.from(msg.payload, "binary");
                    } else if (node.ret === "obj") {
                        try {
                            msg.payload = JSON.parse(msg.payload);
                        } catch (e) {
                            node.warn(RED._("node-red:httpin.errors.json-error"));
                        }
                    }

                    msg.authorized = res.socket.authorized;
                    node.send(msg);
                    node.status({});
                });
            });

            req.setTimeout(node.reqTimeout, function () {
                node.error(RED._(
                    "node-red:common.notification.errors.no-response"), msg);
                setTimeout(function () {
                    util.statusFail(node,"common.notification.errors.no-response");
                }, 10);
                req.abort();
            });

            req.on('socket', function (socket) {
                socket.on('secureConnect', function () {
                    // add the `cert`
                    msg.cert = socket.getPeerCertificate(false);
                    if (msg.cert != null) {
                        delete msg.cert.raw;
                    }
                });
            });

            req.on('error', function (err) {
                node.error(err, msg);
                msg.payload = err.toString() + " : " + url;
                msg.statusCode = err.code;
                node.send(msg);
                util.statusFail(node, err.code);
            });

            if (payload) {
                req.write(payload);
            }
            req.end();
        });

        this.on("close", function () {
            node.status({});
        });
    }

    // !REGISTER
    RED.nodes.registerType("https eval", HTTPRequest, {
        credentials: {
            user: {
                type: "text"
            },
            password: {
                type: "password"
            }
        }
    });
};
