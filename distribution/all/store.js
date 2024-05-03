const util = require('../util/util');
let store = (config) => {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || util.id.naiveHash;
  return {get: (id, callback) => {
    global.distribution.local.groups.get(context.gid, (e, v) => {
      let nidMap = new Map();
      if (e !== null) {
        return callback(e, v);
      } else {
        if (id === null) {
          const remote = {service: 'store', method: 'get'};
          global.distribution[context.gid].comm.send([{key: null,
            gid: context.gid}], remote, (e, v) => {
            return callback(e, Object.values(v).flat());
          },
          );
        } else {
          let allNodeInformation = Object.values(v);
          allNodeInformation.map((node) => {
            let nid = util.id.getNID(node);
            nidMap.set(nid, node);
          });
          id = id.replace(/\W/g, '');
          const nid = context.hash(util.id.getID(id),
              Array.from(nidMap.keys()));
          const node = nidMap.get(nid);
          const toSend = {key: id, gid: context.gid};
          const remote = {node: {ip: node.ip, port: node.port},
            service: 'store', method: 'get'};
          global.distribution.local.comm.send([toSend], remote, (e, v) => {
            callback(e, v);
          });
        }
      }
    });
  }, put: (obj, id, callback) => {
    global.distribution.local.groups.get(context.gid, (e, v) => {
      let nidMap = new Map();
      if (e !== null) {
        return callback(e, v);
      } else {
        let allNodeInformation = Object.values(v);
        allNodeInformation.map((node) => {
          let nid = util.id.getNID(node);
          nidMap.set(nid, node);
        });
        if (id === null) {
          id = util.id.getID(obj);
        }
        id = id.replace(/\W/g, '');
        const nid = context.hash(util.id.getID(id),
            Array.from(nidMap.keys()));
        const node = nidMap.get(nid);
        remote = {node: {ip: node.ip, port: node.port},
          service: 'store', method: 'put'};
        const toSend = {key: id, gid: context.gid};
        global.distribution.local.comm.send([obj, toSend], remote, callback);
      }
    });
  }, del: (id, callback) => {
    if (id === null) {
      return callback(new Error('can\'t be null'), null);
    }

    global.distribution.local.groups.get(context.gid, (e, v) => {
      let nidMap = new Map();
      if (e !== null) {
        return callback(e, v);
      } else {
        let allNodeInformation = Object.values(v);
        allNodeInformation.map((node) => {
          let nid = util.id.getNID(node);
          nidMap.set(nid, node);
        });
        id = id.replace(/\W/g, '');
        const nid = context.hash(util.id.getID(id),
            Array.from(nidMap.keys()));
        remote = {node: nidMap.get(nid),
          service: 'store', method: 'del'};
        global.distribution.local.comm.send([{key: id,
          gid: context.gid}], remote, callback);
      }
    });
  }, reconf: (groupCopy, callback) => {
    global.distribution[context.gid].store.get(null, (e, v) => {
      let allkeys = [];
      allkeys = Object.values(v);
      global.distribution.local.groups.get(context.gid, (e, v) => {
        newGroup = Object.values(v);
        relocate = [];
        let gc = Object.values(groupCopy);
        let groupOldMap = new Map();
        let groupNewMap = new Map();
        gc = gc.map(function(element) {
          elt= util.id.getNID(element);
          groupOldMap.set(elt, element);
          return elt;
        });
        newGroup = newGroup.map(function(element) {
          elt= util.id.getNID(element);
          groupNewMap.set(elt, element);
          return elt;
        });
        gc.sort();
        newGroup.sort();
        for (let id of allkeys) {
          oldhash = context.hash(util.id.getID(id), gc);
          newhash = context.hash(util.id.getID(id), newGroup);
          if (oldhash !== newhash) {
            relocate.push({id: id, old:
                groupOldMap.get(oldhash),
            new: groupNewMap.get(newhash)});
          }
        }
        for (let k of relocate) {
          let remote = {node: k.old, service: 'store', method: 'get'};
          global.distribution.local.comm.send([{key: k.id,
            gid: context.gid}], remote, (e, v) => {
            const obj = v;
            remote = {node: k.old, service: 'store', method: 'del'};
            global.distribution.local.comm.send([{key: k.id,
              gid: context.gid}], remote, (e, v) => {
            });
            remote = {node: k.new, service: 'store', method: 'put'};
            global.distribution.local.comm.send([obj, {key: k.id,
              gid: context.gid}], remote, (e, v) => {
            });
          });
        }
        setTimeout(() => {
          return callback();
        }, '10');
      });
    });
  }};
};

module.exports = store;
