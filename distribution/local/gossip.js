const gossip = {s: 's'};
const received = new Set();
function getRandomKeys(obj, n) {
  // Get all keys from the object
  const keys = Object.keys(obj);
  // Shuffle the keys array
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]]; // Swap elements
  }
  return keys.slice(0, n);
}

gossip.recv = function(args, remote, size, group, callback) {
  const uniqueKey = JSON.stringify({args: args, remote: remote});
  if (!received.has(uniqueKey)) {
    received.add(uniqueKey);
    let r = {...remote, node: global.nodeConfig};
    distribution.local.comm.send(args, r, callback);
    const randomKeys = getRandomKeys(group, size);
    for (const key of randomKeys) {
      r = {service: 'gossip', method: 'recv', node: Reflect.get(group, key)};
      distribution.local.comm.send([args, remote, size, group], r, callback);
    }
  }
};
module.exports = gossip;