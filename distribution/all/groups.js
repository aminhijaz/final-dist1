const groups = function (context) {
  let groupId = context.gid || 'all';
  return {
    put: function (key, value, callback) {
      global.distribution.local.groups.put(key, value, (error, result) => {
        if (error) {
          callback(error);
        }
        global.distribution[context.gid].comm.send([key, value], { service: "groups", method: "put" }, callback);
      });
    },
    del: function (key, callback) {
      global.distribution[groupId].comm.send([key], { service: "groups", method: "del" }, callback);
    },
    get: function (key, callback) {
      global.distribution[groupId].comm.send([key], { service: "groups", method: "get" }, callback);
    },
    add: function (key, value, callback) {
      global.distribution.local.groups.add(key, value, (error, result) => {
        if (error) {
          callback(error);
        }
        global.distribution[groupId].comm.send([key, value], { service: "groups", method: "add" }, callback);
      });
    },
    rem: function (key, value, callback) {
      global.distribution.local.groups.rem(key, value, (error, result) => {
        if (error) {
          callback(error);
        }
        global.distribution[groupId].comm.send([key, value], { service: "groups", method: "rem" }, callback);
      });
    }
  };
};
module.exports = groups;
