var parseMsg = function (RED, node, inputType, input, msg) {
  var inp = '';
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
      default:
        inp = input;
    }
  } catch (err) {
    inp = input;
    node.warn(err);
  }
  return inp;
}

var statusOk = function (node, value) {
  node.status({
    fill: 'green',
    shape: 'ring',
    text: value
  });
}

var statusFail = function (node, value) {
  node.status({
    fill: 'red',
    shape: 'dot',
    text: value
  });
}

module.exports = {
  parseMsg : parseMsg,
  statusOk : statusOk,
  statusFail : statusFail,
};
