module.exports = function (RED) {
    "use strict";

    const when = require('when');
    const _ = require('underscore');
    const EventEmitter = require('events').EventEmitter;

    function SourceEventNode(n) {
        RED.nodes.createNode(this, n);

        this.configNode = RED.nodes.getNode(n.config);
        this.expire = n.expire;
        this.name = n.name;
        this.output = n.output;
        this.expire = n.expire; //It will expire after a set time
        this.expval = n.expval; //Expire value
        this.exptimer = null; //Expire timer
        this.hysteresis = n.hysteresis;
        this.def = n.def; //Default value
        this.uid = n.uid;
        this.toggle = n.toggle; //Toggle is active
        this.cycle = n.cycle; //Cycle is active
        this.cyclen = n.cyclen;

        var self = this;

        //Keep a local variable for storing the last received value for hysteresis verification
        self.prevpayload = null;

        //Used to toggle an value
        self.prevtoggle = '0';

        //Initialise config
        self.configNode.initialise();

        //Send a message if a default message has been set
        if (self.def.trim().length > 0) {
            setTimeout(function () {
                self.receivedMessage({
                    topic: '',
                    payload: self.def
                }, true);
            }, 1000);
        }

        //Calculate timeout in millisecs
        if (this.expire) {
            if (n.timeoutUnits === "milliseconds") {
                this.exptimeout = n.timeout;
            } else if (n.timeoutUnits === "seconds") {
                this.exptimeout = n.timeout * 1000;
            } else if (n.timeoutUnits === "minutes") {
                this.exptimeout = n.timeout * 1000 * 60;
            } else if (n.timeoutUnits === "hours") {
                this.exptimeout = n.timeout * 1000 * 60 * 60;
            } else if (n.timeoutUnits === "days") {
                this.exptimeout = n.timeout * 1000 * 60 * 60 * 24;
            }
        }

        /*
        A method to make sure that a value is only sent once to the rules that
        are subscribing to the source. If the value changes it will send a new
        event
        */
        self.lastSendPayload;
        self.sendToRules = function (payload) {
            if (typeof self.lastSendPayload == "undefined" ||
                (typeof self.lastSendPayload !== "undefined" &&
                    self.lastSendPayload != payload)) {
                self.configNode.emitConfig(self.uid, payload);
            }
            self.lastSendPayload = payload;
        }

        self.receivedMessage = function (msg, internal = false) {
            //Check if toggle is active and toggle between 0 and 1
            if (!internal && self.toggle) {
                if (self.prevtoggle == '0') {
                    msg.payload = '1';
                } else {
                    msg.payload = '0'
                }
                self.prevtoggle = msg.payload;
            }

            //Check if cycle is active and cycle through 0 to cyclen
            if (!internal && self.cycle) {
                //Increase toggle value
                self.prevtoggle++;

                //If value is exceeding cyclen reset
                if (self.prevtoggle > self.cyclen) {
                    self.prevtoggle = '0';
                }
                msg.payload = self.prevtoggle;
            }

            // Check if outside hysteresis value only if it is larger than
            if (!isNaN(self.hysteresis) && !isNaN(msg.payload) && self.hysteresis >
                0) {
                if (self.prevpayload !== null) {
                    var diff;
                    if (self.prevpayload > msg.payload) {
                        diff = self.prevpayload - msg.payload;
                    } else {
                        diff = msg.payload - self.prevpayload;
                    }

                    //If the difference is not large enough discard the message
                    if (diff < self.hysteresis) {
                        return;
                    } else {
                        //Save the new value for next comparison
                        self.prevpayload = msg.payload;
                    }
                } else {
                    //Store the received value
                    self.prevpayload = msg.payload;
                }
            } else {
                // Reset prev value
                self.prevpayload = null;
            }
            if (isNaN(self.hysteresis)) {
                // hysteresis is not a number!
            }

            //Send the message to emitter then send it further
            self.sendToRules(msg.payload);

            //If there is an output send the message
            if (self.output) {
                self.send(msg);
            }

            //Check if there is a timeout value
            if (self.expire) {
                //Clear old
                if (self.exptimer) {
                    clearTimeout(self.exptimer);
                }
                self.exptimer = setTimeout(function () {
                    self.sendToRules(self.expval);
                    if (self.output) {
                        self.send({
                            payload: self.expval
                        });
                    }
                    // reset prev value
                    self.prevtoggle = '0';
                    self.prevpayload = null;
                }, self.exptimeout);
            }
        }

        self.on("input", function (msg) {
            self.receivedMessage(msg);
        });

        self.on("close", function () {
            //Stop the timer
            if (self.exptimer) {
                clearTimeout(self.exptimer);
            }

            //Clear local variables
            self.prevpayload = null;
        });
    }

    // !Register
    RED.nodes.registerType("source-event", SourceEventNode);
};
