const distribution = require('../../distribution');
const fetch = require('node-fetch');
<<<<<<< HEAD
<<<<<<< HEAD
=======
const { publicIp, publicIpv4, publicIpv6 } = require('public-ip');
>>>>>>> e58770dad20c2008c237a734fcd4eeca0a2c864c
=======
const { publicIp, publicIpv4, publicIpv6 } = require('public-ip');
>>>>>>> e58770dad20c2008c237a734fcd4eeca0a2c864c

function createListener(nNodes, id, gid, callback) {
  return {
    map: 0,
    shuffle: 0,
    reduce: 0,
    callback: callback,
    listen: function(o) {
      if (o['phase'] === 'map') {
        this.map+=1;
        if (this.map === nNodes) {
          const remote = {service: 'mr' + String(id), method: 'map'};
          global.distribution[gid].comm.send([], remote, (e, v) => {
            if (Object.keys(e).length !== 0) {
              return this.callback(e, null);
            }
          });
        }
      }
      if (o['phase'] === 'shuffle') {
        this.shuffle +=1;
        if (this.shuffle === nNodes) {
          const remote = {service: 'mr' + String(id), method: 'shuffle'};
          distribution[gid].comm.send([], remote, (e, v) => {
            if (Object.keys(e).length !== 0) {
              return this.callback(e, null);
            }
            let obj = {};
            for (elt of Object.values(v)) {
              for (key of Object.keys(elt)) {
                if (key in obj) {
                  obj[key].push(elt[key]);
                  obj[key]= obj[key].flat();
                } else {
                  obj[key] = [];
                  obj[key].push(elt[key]);
                  obj[key] = obj[key].flat();
                }
              }
            }
            for (key of Object.keys(obj)) {
              distribution['all'].store.put(obj[key], key, (e, v) =>{
                if (e) {
                  this.callback(e, v);
                }
              });
            }
            const remote = {service: 'mr' + String(id), method: 'notify'};
            distribution[gid].comm.send([{phase: 'reduce'}], remote, (e, v) => {
              if(e) {
                this.callback(e,v)
              }
            });
          });
        }
      }
      if (o['phase'] === 'reduce') {
        this.reduce +=1;
        if (this.reduce === nNodes) {
          const remote = {service: 'mr' + String(id), method: 'reduce'};
          distribution[gid].comm.send([], remote, (e, v) => {
            if (Object.keys(e).length !== 0) {
              return this.callback(e, null);
            }
            let res = [];
            if (Object.values(v).length === nNodes) {
              for (value of Object.values(v)) {
                if (value.length != 0) {
                  res = res.concat(value);
                }
              }
              let r = {service: 'routes', method: 'del'};
              distribution[gid].comm.send(['mr' + String(id)], r, (e, v) => {
                distribution['all'].store.get(null, async (e, v) => {
                  const promises = v.map((key) =>
                    new Promise((resolve, reject) => {
                      global.distribution['all'].store.del(key, (e, value) => {
                        if (e) {
                        } else {
                          resolve(key);
                        }
                      });
                    }));
                  try {
                    const wait = await Promise.all(promises);
                  } catch (error) {
                    console.error('Error cleaning up:', error);
                    return callback(error, null);
                  }
                },
                );
                return this.callback(null, res);
              });
            }
          }
          
          );
        }
      }
    },
  };
}

function createMrService(c,
    node,
    id,
    gid,
    mapFn,
    reducefn,
    memory,
    compact,
    count) {
  return {
    id: id,
    gid: gid,
    mapFn: mapFn,
    reducefn: reducefn,
    node: node,
    memory: memory,
    compact: compact,
    count: count,
    c: c,
    obj: {},
    notify: function(obj, callback) {
      const n = {node: this.c, service: 'listener' + this.id, method: 'listen'};
      global.distribution.local.comm.send([obj], n, (e, v) => {
      });
    },
    map: async function(callback) {
      global.distribution.local.store.get({key: null, gid: this.gid},
          async (e, v) => {
            if (e) {
              callback(e, v);
            }
            const promises = v.map((key) => new Promise((resolve, reject) => {
              if (this.memory) {
                global.distribution.local.mem.get({
                  key: key,
                  gid:
                  this.gid}, async (e, value) => {
                  if (e) {
                    reject(e);
                  } else {
                    let res = await this.mapFn(key, value);
                    for (let i=0; i<this.count; i++) {
                      res = this.mapFn(Object.keys(res)[0],
                          Object.values(res)[0]);
                    }
                    resolve(res);
                  }
                });
              } else {
                global.distribution.local.store.get({key: key, gid:
                  this.gid}, async (e, value) => {
                  if (e) {
                    reject(e);
                  } else {
                    resolve(await this.mapFn(key, value));
                  }
                });
              }
            }));
            try {
              let mapRes = await Promise.all(promises);
              mapRes = this.compact(mapRes.flat());
              if (this.memory) {
                global.distribution.local.mem.put(mapRes,
                    {key: 'mapRes',
                      gid: 'mapRes' + String(this.id)}, (error, result) => {
                      if (error) {
                        console.error('Error saving map results:', error);
                        callback(error, null);
                      } else {
                        this.notify({phase: 'shuffle'}, callback);
                        return callback(null, mapRes);
                      }
                    });
              } else {
                global.distribution.local.store.put(mapRes,
                    {key: 'mapRes',
                      gid: 'mapRes' + String(this.id)}, (error, result) => {
                      if (error) {
                        console.error('Error saving map results:', error);
                        callback(error, null);
                      } else {
                        this.notify({phase: 'shuffle'}, callback);
                        return callback(null, mapRes);
                      }
                    });
              }
            } catch (error) {
              console.error('Error during map operations:', error);
              callback(error, null);
            }
          });
    },
    shuffle: function(callback) {
      if (this.memory) {
        global.distribution.local.mem.get({key: 'mapRes',
          gid: 'mapRes' + String(this.id)}, (e, v) => {
          for (elt of v) {
            if (Object.keys(elt)[0] in this.obj) {
              this.obj[Object.keys(elt)[0]].push(Object.values(elt)[0]);
            } else {
              this.obj[Object.keys(elt)[0]] = [Object.values(elt)[0]];
            }
          }
          return callback(null, this.obj);
        });
      } else {
        global.distribution.local.store.get({key: 'mapRes',
          gid: 'mapRes' + String(this.id)}, (e, v) => {
          for (elt of v) {
            if (Object.keys(elt)[0] in this.obj) {
              this.obj[Object.keys(elt)[0]].push(Object.values(elt)[0]);
            } else {
              this.obj[Object.keys(elt)[0]] = [Object.values(elt)[0]];
            }
          }
          return callback(null, this.obj);
        });
      }
    },
    reduce: async function(callback) {
      if (this.memory) {
        global.distribution.local.mem.get({key: null,
          gid: 'all'}, async (e, v) => {
          if (e) {
            console.error('Error fetching keys:', e);
            return callback(error, null);
          }
          const promises = v.map((key) => new Promise((resolve, reject) => {
            global.distribution.local.store.get({key: key,
              gid: 'all'}, (e, value) => {
              if (e) {
                reject(e);
              } else {
                resolve(this.reducefn(key, value));
              }
            });
          }));

          try {
            const redRes = await Promise.all(promises);
            return callback(null, redRes);
          } catch (error) {
            console.error('Error during map operations:', error);
            return callback(error, null);
          }
        });
      } else {
        global.distribution.local.store.get({key: null,
          gid: 'all'}, async (e, v) => {
          if (e) {
            console.error('Error fetching keys:', e);
            return callback(error, null);
          }
          const promises = v.map((key) => new Promise((resolve, reject) => {
            global.distribution.local.store.get({key: key,
              gid: 'all'}, (e, value) => {
              if (e) {
                reject(e);
              } else {
                resolve(this.reducefn(key, value));
              }
            });
          }));

          try {
            const redRes = await Promise.all(promises);
            return callback(null, redRes);
          } catch (error) {
            console.error('Error during map operations:', error);
            return callback(error, null);
          }
        });
      }
    },
  };
}

global.mrC = 0;
const mr = function(config) {
  let context = {};
  context.gid = config.gid || 'all';
  return {
    exec: async (configuration, callback) => {
      global.mrC +=1;
      /* Change this with your own exciting Map Reduce code! */
      const mapfn = configuration.map;
      const reducefn = configuration.reduce;
      const memory = configuration.memory || false;
      const count = configuration.count || 0;

      const compact = configuration.compact || ((val) => val);
      global.distribution.local.groups.get(context.gid,
          async (e, v) => {
            if (e) {
              return callback(e, []);
            }
            nodes = v;
            const nNodes = Object.keys(nodes).length;
            global.distribution.local.routes.put(
                createListener(nNodes,
                    String(global.mrC),
                    context.gid, callback),
                'listener' + String(global.mrC), (e, v) => {
                  if (e) {
                    callback(e, null);
                  }
                });
            for (key of Object.keys(v)) {
              const node = v[key];
              const ip = await publicIp.v4()
              console.log(ip)              
              let mrService = createMrService(global.nodeConfig,
                  node,
                  String(global.mrC),
                  context.gid,
                  mapfn,
                  reducefn,
                  memory,
                  compact,
                  count,
              );
              let remote = {node: {ip: node.ip, port: node.port},
                service: 'routes', method: 'put'};
              global.distribution.local.comm.send([mrService,
                'mr' + String(global.mrC)], remote, (e, value) => {
                if (e) {
                  return callback(e, null);
                }
              });
            }
            let remote = {service: 'mr' + String(global.mrC), method: 'notify'};
            global.distribution[context.gid].comm.send([{phase: 'map'}],
                remote, (e, v) => {
                });
          });
    },
  };
};

module.exports = mr;

