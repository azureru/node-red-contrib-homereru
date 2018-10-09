module.exports = function(RED) {
  "use strict";

  var when = require('when');
  var _ = require('underscore');
  var EventEmitter = require('events').EventEmitter;

  function HmrEvent(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.delay = n.delay;
    this.initialised = false;
  }

  RED.nodes.registerType("config-event", HmrEvent);

  // emitter init
  HmrEvent.prototype.initialise = function() {
    if (this.initialised) {
      return;
    }
    this.initialised = true;
    this.emitter = new EventEmitter();
  }

  // event handler
  HmrEvent.prototype.onConfig = function(type, cb) {
    this.emitter.on(type, cb);
  }

  // event emitter
  HmrEvent.prototype.emitConfig = function(type, payload) {
    this.emitter.emit(type, payload);
  }
}
