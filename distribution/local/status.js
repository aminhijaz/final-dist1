const id = require('../util/id');
const wire = require('../util/wire');
const serialization = require('../util/serialization');
const {spawn} = require('node:child_process');
const path = require('path');
const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() {};

  if (configuration in global.nodeConfig) {
    callback(null, global.nodeConfig[configuration]);
  } else if (configuration in moreStatus) {
    callback(null, moreStatus[configuration]);
  } else if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
  } else if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
  } else {
    callback(new Error('Status key not found'));
  }
};

status.spawn = function(config, callback) {
  callback = callback || function() {};
  const callbackRPC = wire.createRPC(
      wire.toAsync(callback),
  );
  let newConfig;
  if (config.hasOwnProperty('onStart')) {
    let oldOnStart = config.onStart;
    let twoCallBack = `
            let onStart = ${oldOnStart.toString()};
            let callbackRPC = ${wire.createRPC(
      wire.toAsync(callback)).toString()};
            onStart();
            callbackRPC(null, global.nodeConfig, () => {});
            `;
    newConfig = {...config, onStart: new Function(twoCallBack)};
  } else {
    let oneCallBack = `
            let callbackRPC = ${callbackRPC.toString()};
            callbackRPC(null, global.nodeConfig, () => {});
            `;
    newConfig = {...config, onStart: new Function(oneCallBack)};
  }
  spawn('node', [path.join(__dirname, '../../distribution.js'),
    '--config', serialization.serialize(newConfig)]);
};
status.stop = function(callback) {
  setTimeout(function() {
    global.server.close();
    process.exit();
  }, 1);
  return callback(null, global.nodeConfig);
};


module.exports = status;
