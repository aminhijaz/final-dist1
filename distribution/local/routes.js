const routes = {}
routes.get = function(s, f) {
    if (global.stringfunc.has(s)) {
       f(null, global.stringfunc.get(s));
    } else if (s === "rpc") {
        const handler = global.toLocal.get(s);
        handler ? f(null, handler) : f(new Error('Service ' + s + ' not found in routes'));
    }
    else { 
        f(new Error('Service ' + s + ' not found in routes'));
    }
  }
  routes.put = function(service, str, f) {
    global.stringfunc.set(str, service);
     f(null, service);
  };
  global.stringfunc.set("comm", require('./comm'));
  global.stringfunc.set("status", require('./status'));
  global.stringfunc.set("groups", require('./groups'));
  global.stringfunc.set("gossip", require('./gossip'));
  global.stringfunc.set("mem", require('./mem'));
  global.stringfunc.set("store", require('./store'));
  global.stringfunc.set("routes", routes);
  
module.exports = routes