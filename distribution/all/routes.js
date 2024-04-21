let routes = (config) => {
    let context = {};
    context.gid = config.gid;
    context.group = config.group;
    return {
      put: function(service, name, callback) {
        return global.distribution[context.gid].comm.send([service, name],
            {service: 'routes', method: 'put'}, (e, v) => {
              callback(e, v);
            });
      },
    };
  };
  module.exports = routes;