const id = require('../util/id');
const groups = {};
groups.get = function(groupName, callback) {
callback = callback || function () {};
  if (global.g.has(groupName)) {
    res = global.g.get(groupName)
     callback(null, res);
  }
  else {
     callback(new Error("no group"));
  }
};
groups.put = function(groupName, g, callback) {
    if (typeof groupName === 'string') {
        groupName = { 'gid': groupName };
    }

    // Update specific group
    global.g.set(groupName.gid, g);

    // Ensure 'all' group is updated
    if (!global.g.has('all')) {
        global.g.set('all', {});
    }
    let allGroup = global.g.get('all');
    Object.keys(g).forEach(key => {
        allGroup[key] = g[key];
    });
    global.g.set('all', allGroup);

    global.distribution[groupName.gid] = {
        status: require('../all/status')(groupName),
        comm: require('../all/comm')(groupName),
        gossip: require('../all/gossip')(groupName),
        groups: require('../all/groups')(groupName),
        routes: require('../all/routes')(groupName),
        mem: require('../all/mem')(groupName),
        store: require('../all/store')(groupName),
        mr: require('../all/mr')(groupName),
    };

    return callback(null, g);
};

groups.add = function(groupName, node, callback) {
    callback = callback || function() {};
    if (!global.g.has(groupName)) {
        callback(new Error('group doesn\'t exist'), null);
    } else {
        let res = global.g.get(groupName);
        res[id.getSID(node)] = node;
        global.g.set(groupName, res);

        // Update 'all' group
        let allGroup = global.g.get('all') || {};
        allGroup[id.getSID(node)] = node;
        global.g.set('all', allGroup);

        callback(null, res);
    }
};
groups.rem = function(groupName, sid, callback) {
  callback = callback || function() {};
  let res = global.g.get(groupName);
  if (res === undefined) {
    callback(new Error('group doesn\'t exist'), null);
  }
  else {
    delete res[sid];
    global.g.set(groupName, res);
    callback(null, res);
  }
};

groups.del = function(groupName, callback) {
  callback = callback || function() {};
  let res = global.g.get(groupName);
  if (res === undefined) {
    return callback(new Error('group doesn\'t exist'), null);
  }
  else {
    global.g.delete(groupName);
    return callback(null, res);
  }
};
module.exports = groups;

