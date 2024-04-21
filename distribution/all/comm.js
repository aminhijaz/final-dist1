let comm = (config) => {
    let context = {};
    context.gid = config.gid || 'all';
    return {
      send: (message, remote, callback) => {
        const values = {};
        const errors = {};
        let count = 0;
        global.distribution.local.groups.get(context.gid, (e, v) => {
          if (e) {
            callback(e, null);
          } else {
            let nodesInGroup = Object.entries(v).length;
            for (const [key, node] of Object.entries(v)) {
              const config = {node: node, ...remote};
              setTimeout(function() {
                global.distribution.local.comm.send(message, config, (e, v) => {
                    count += 1;
                    if (e) {
                      errors[key] = e;
                    } else {
                      values[key] = v;
                    }
                    if (count === nodesInGroup) {
                      callback(errors, values);
                    }
                  });
    
              }, 10)
            }
          }
        });
      },
    };
  };
  module.exports = comm;
  