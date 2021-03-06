module.exports = function (RED) {
    "use strict";

    const when = require('when');
    const _ = require('underscore');
    const EventEmitter = require('events').EventEmitter;

    var operators = {
        'eq': function (a, b) {
            return a == b;
        },
        'neq': function (a, b) {
            return a != b;
        },
        'lt': function (a, b) {
            return a < b;
        },
        'lte': function (a, b) {
            return a <= b;
        },
        'gt': function (a, b) {
            return a > b;
        },
        'gte': function (a, b) {
            return a >= b;
        },
        'btwn': function (a, b, c) {
            return a >= b && a <= c;
        },
        'cont': function (a, b) {
            return (a + "").indexOf(b) != -1;
        },
        'regex': function (a, b) {
            return (a + "").match(new RegExp(b));
        },
        'true': function (a) {
            return a === true;
        },
        'false': function (a) {
            return a === false;
        },
        'null': function (a) {
            return typeof a == "undefined";
        },
        'nnull': function (a) {
            return typeof a != "undefined";
        }
    };

    function HmrHandlerNode(n) {
        RED.nodes.createNode(this, n);

        this.configNode = RED.nodes.getNode(n.config);
        this.rules = n.rules;
        this.checkall = (n.checkall === "true");
        this.repeattimer; //Timer for resending messages
        this.timeouttimer; //Timer for managing a delay in send (if there are many incoming messages)
        this.values = []; //Keeping all the inbound messages
        this.outputdelay = n.outputdelay;
        this.disablerepeat = n.disablerepeat;
        this.name = n.name;

        this.numberOfListeners = 0; //List number of listeners
        this.srcPrefix = '[src:]'; //Identifies if a value should come from an nrl-source

        let self = this;

        //Keeps track if an input msg has been received
        self.inputreceived = false;
        self.inputson = n.inputson;
        self.basemsg = null;

        //Functions to work with the values store (keeps updates from the sources)
        self.valuesAdd = function (id, val) {
            let found = _.findIndex(self.values, function (obj) {
                return obj.id == id
            });
            if (found === -1) {
                self.values.push({
                    id: id,
                    value: val
                });
            } else {
                self.values[found] = {
                    id: id,
                    value: val
                };
            }
        };

        self.valueGet = function (id) {
            var found = _.find(self.values, function (obj) {
                return obj.id == id
            });
            return (found != undefined ? found.value : undefined);
        };

        //Initialise config
        self.configNode.initialise();

        //Tidy up to ensure correct numbers in values
        for (var i = 0; i < this.rules.length; i += 1) {
            let rule = this.rules[i];

            //Copy src references to new variables
            // rule.vs and rule.v2s (s=source)
            if (rule.v.indexOf(self.srcPrefix) == 0) {
                rule.vs = rule.v.substr(self.srcPrefix.length);
                rule.v = '';
            }
            if (rule.v2 && rule.v2.indexOf(self.srcPrefix) == 0) {
                rule.v2s = rule.v2.substr(self.srcPrefix.length);
                rule.v2 = '';
            }

            if (!isNaN(Number(rule.v)) && !rule.vs) {
                rule.v = Number(rule.v);
            }
            if (!isNaN(Number(rule.v2)) && !rule.v2s) {
                rule.v2 = Number(rule.v2);
            }
        }

        //Assessment of all rules
        self.assessRules = function () {

            //Validate the rules
            let numbersTrue = 0;
            let valueArr = [];

            _.each(self.rules, function (rule) {
                //Get the value to compare with
                // rule.v2 is not always available. Only used for between values
                let val = self.valueGet(rule.s);
                let v = rule.vs ? self.valueGet(rule.vs) : rule.v;
                let v2 = rule.v2s ?
                    self.valueGet(rule.v2s) : (rule.v2 ? rule.v2 : 0);

                if (val != undefined && v != undefined && v2 != undefined) {
                    //Validate the rules
                    if (operators[rule.t](val, v, v2)) {
                        // matched
                        valueArr.push({
                            "name": rule.n,
                            "id": rule.s,
                            "value": val
                        });
                        numbersTrue++;
                    }
                }
            })

            let msg = {
                matched: valueArr
            };

            // all rule matched | or minimum one rule is matched
            if (numbersTrue === self.rules.length || (numbersTrue > 0 && !self.checkall)) {
                if (!self.inputson) {
                    // rule matched
                    msg.enabled = true;
                } else {
                    if (self.inputreceived) {
                        // rule not matched - but the value comes from input node
                    } else {
                        // rule not matched
                        msg.enabled = false;
                    }
                }
            } else {
                // no rule matched
                msg = null;
            }

            /*
            Only send out the message if no input is used or if a new base payload has
            been received. If msg == null don't bother. It is null if it should check for all rules and not all values
            yet been have been received
            */
            if ((!self.inputson || self.inputreceived) && msg) {
                //Send the message
                self.timeouttimer = setTimeout(function () {
                    self.send(msg);

                    //Only setup repeat for top eval node and if not explicitly disabled
                    if (!self.inputson && !self.disablerepeat) {
                        self.repeattimer = setInterval(self.assessRules, 60 * 1000);
                    }
                }, self.outputdelay ?
                    0 : (parseInt(self.configNode.delay) * 1000));

                //Setup repeat every 1min
                if (self.repeattimer) {
                    clearInterval(self.repeattimer);
                }
            }
        };

        //Add listeners for all sources
        when.promise(function (resolve, reject) {
            var list = [];
            for (var i = 0; i < self.rules.length; i++) {
                list.push(self.rules[i].s);

                //Add values if sources are being used
                if (self.rules[i].vs) {
                    list.push(self.rules[i].vs);
                }
                if (self.rules[i].v2s) {
                    list.push(self.rules[i].v2s);
                }
            }
            if (list.length === 0) {
                reject("No rules defined");
            }
            //Save number of listeners
            self.numberOfListeners = _.uniq(list).length;
            //Make the list unique
            resolve(_.uniq(list));

        }).then(function (list) {
            //Setup the listener for the event to re-evaluate the rules
            _.each(list, function (id) {
                self.configNode.onConfig(id, function (val) {
                    //Stop possible delay timer
                    if (self.timeouttimer) {
                        clearTimeout(self.timeouttimer);
                    }

                    //Stop the timer to avoid a new repetitive message sent before processing
                    if (self.repeattimer) {
                        clearInterval(self.repeattimer);
                    }
                    //Store the value
                    self.valuesAdd(id, val);
                    self.assessRules();
                });
            });
        }, function (err) {
            //Something went wrong
            self.warn(err);
        });

        /* Register a listener if the node has an input */
        if (self.inputson) {
            self.on("input", function (msg) {
                self.basemsg = msg;
                self.inputreceived = true;

                //Stop possible delay timer
                if (self.timeouttimer) {
                    clearTimeout(self.timeouttimer);
                }
                //Start assessment
                self.assessRules();
            });
        }

        self.on("close", function () {
            if (self.timeouttimer) {
                clearTimeout(self.timeouttimer);
            }
            if (self.repeattimer) {
                clearInterval(self.repeattimer);
            }
            //Clear values
            self.inputreceived = false;
        });

    }

    // !Register
    RED.nodes.registerType("handler-event", HmrHandlerNode);
};
