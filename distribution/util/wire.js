const serialization = require('./serialization');
const {distribution} = require('../../distribution');
var crypto = require('crypto');
function createRPC(func) {
  // Write some code...
  function g(...args) {
    let cb = args[args.length - 1] || function() {};
    let remote = {
      node: '__NODE_INFO__',
      service: 'rpc',
      method: '__METHOD_ID__',
    };
    // console.log(args)
    remote.node = {ip: remote.node.split(":")[0], port: parseInt(remote.node.split(":")[1])}
    distribution.local.comm.send(args, remote, (e, v) => {
      cb(e, v);
    });
  }
  const hash = crypto.createHash('sha256');
  hash.update(serialization.serialize(func));
  const id = hash.digest('hex');
  if (global.toLocal === undefined) {
    global.toLocal = new Map();
  }
  global.toLocal.set(id, func);
  let serialized = serialization.serialize(g);
  console.log(global.nodeConfig.port)
  serialized = serialized.replace(
      '\'__NODE_INFO__\'',
      '\'' + global.nodeConfig.ip + ':' + global.nodeConfig.port + '\'',
  );
  serialized = serialized.replace('\'__METHOD_ID__\'',
      '\'' + id.toString() + '\'');
    console.log(serialized)
  return serialization.deserialize(serialized);
}

/*
    The toAsync function converts a synchronous function that returns a value
    to one that takes a callback as its last argument and returns the value
    to the callback.
*/
function toAsync(func) {
  return function(...args) {
    const callback = args.pop() || function() {};
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
