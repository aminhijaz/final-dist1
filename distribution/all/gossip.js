const distribution = require('../../distribution');

function getRandomKeys(obj, n) {
  // Get all keys from the object
  const keys = Object.keys(obj);
  // Shuffle the keys array
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]]; // Swap elements
  }
  // Return the first three keys
  return keys.slice(0, n);
}

let gossip = (config) => {
  let context = {}; // create service-local context.
  context.gid = config.gid || 'all';
  context.subset = config.subset || 3;
  context.group = config.group;
  return {send: (message, remote, callback) => {
    global.distribution.local.groups.get(context.gid,  (e, v) => {
        const randomKeys = getRandomKeys(v, context.subset);
        for (key of randomKeys) {
            let r = {node: global.nodeConfig, service: 'gossip', method: 'recv'};
            global.distribution.local.comm.send([message, remote, context.subset,
              v], r, (e, v) => {
                callback(e,v) 
            });
          }
    });
  },
  at: (interval, func, callback) => {
    const id = setInterval(() => {
      try {
        res = func();
        callback(null, id);
      } catch (error) {
        callback(error, id);
      }
    }, interval);
  },
  del: (id, callbacl) => {
    if (context.timers[id]) {
      clearInterval(id);
      delete context.timers[id];
      callback(null, null);
    } else {
      callback(new Error('Timer ID not found'), null);
    }
  }};
};

module.exports = gossip;