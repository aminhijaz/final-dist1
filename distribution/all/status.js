const distribution = require('../../distribution');
const id = require('../util/id');
let status = (config) => {
  let context = {};
  context.gid = config.gid;
  context.group = config.group;
  return {
    spawn: (configuration, callback) => {
        callback = callback || function () {};
        global.distribution.local.status.spawn(configuration, (error, result) => {
            if (error) {
                callback(error);
            } else {
                global.distribution.local.groups.add(context.gid, configuration, () => {
                    callback(null, result);
                });
                global.distribution[context.gid].groups.add(context.gid,
                    configuration, (e, v) => {
                    });

            }
        });
    },
    get: (name, callback) => {
      remote = {service: 'status', method: 'get'};
      if (name === 'heapTotal') {
        global.distribution[context.gid].comm.send([name], remote, (e, v) => {
          let t = 0;
          for (key of Reflect.ownKeys(v)) {
            t += Reflect.get(v, key);
          }
          callback(e, t);
        });
      } else {
        global.distribution[context.gid].comm.send([name], remote, callback);
      }
    },
    stop: (callback) => {
      remote = {service: 'status', method: 'stop'};
      return global.distribution[context.gid].comm.send([], remote, callback);
    },
  };
};
module.exports = status;
