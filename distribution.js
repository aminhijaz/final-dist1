#!/usr/bin/env node

const util = require('./distribution/util/util.js');
const args = require('yargs').argv;
const groupsTemplate = require('./distribution/all/groups');
const fs = require('fs');
global.fs = fs
const lockingUtility = require('./utility');
global.lockingUtility = lockingUtility
const lockfile = require('proper-lockfile');
global.lockfile = lockfile
const readline = require('readline');
const id = require("./distribution/util/id.js")
global.id = id
const path = require('path');    
const { availableParallelism } = require('os');
global.fetch = require("node-fetch")
global.cheerio = require('cheerio');
global.axios = require('axios')
global.path = path
const got = require('got');
global.got = got
global.nodeConfig = global.nodeConfig || {
  ip: '127.0.0.1',
  port: 8080,
  onStart: () => {
    console.log('Node started!');
  },
};
global.g = new Map()
/*
    As a debugging tool, you can pass ip and port arguments directly.
    This is just to allow for you to easily startup nodes from the terminal.

    Usage:
    ./distribution.js --ip '127.0.0.1' --port 1234
  */
if (args.ip) {
  global.nodeConfig.ip = args.ip;
}

if (args.port) {
  global.nodeConfig.port = parseInt(args.port);
}
let r1 = (key, values) => {
  let obj = {};
  obj[key] = values;
  return obj;
};

let m1c = async (key, value) => {  
  try {
    await global.fetchAndWriteToFile(value, key);
  } catch (err) {
    console.log(err);
  }
  let obj = {};
  obj[""] = 1;
  return obj;
};
SIZE = 100

global.fetchAndWriteToFile = async (urls, key) => {
  console.log(urls)
  for(url of urls) {
    if(global.lockingUtility.visited(url)) {
      return
    }
  try {
    const response = await global.fetch(url);
    if (!response.ok) {
      console.log(url)
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.text();
    let $ = global.cheerio.load(content);
    const images = $('img');        
    images.each(async (index, element) => {
      let imageUrl = $(element).attr('src');
      if (imageUrl) {
          // Check if the URL is relative, and if so, prepend it with the base URL
          if (!/^(?:[a-z+]+:)?\/\//i.test(imageUrl)) {
            try {
              imageUrl = new URL(imageUrl, url).href;
            }
              catch(error) {
                console.log(error)
                return
              }
          }
            distribution.index.store.put(imageUrl, null,  (e, v) => {
            });
      }
  });
  $ = global.cheerio.load(content);
  const links = $('a')
  keys = []
  values = []
  send = false
  global.distribution.crawler.store.del(key, (e,v) => {
  })
  let toSend =[]
  let k =0
  links.each(async (index, element) => {
    let u = $(element).attr('href');
    if (!/^(?:[a-z+]+:)?\/\//i.test(u)) {
      try {
        u = new URL(u, url).href;
      } catch(error) {
        return
      }
  }
  toSend.push(u)
  k+=1
  send = true
  if(k === SIZE) {
    send = false
    keys.push(k)
    global.distribution.crawler.store.put(toSend, k.toString(), (e,v) => {
      if(e) {
        console.log(e)
      }
    })
    toSend = []
  }
  });
  if(send) {
    global.distribution.crawler.store.put(toSend, k.toString(), (e,v) => {
      if(e) {
        console.log(e)
      }
    })  
  }

  } catch (error) {
    console.log(error)
  }
  }
}



if (args.config) {
  let nodeConfig = util.deserialize(args.config);
  global.nodeConfig.ip = nodeConfig.ip ? nodeConfig.ip : global.nodeConfig.ip;
  global.nodeConfig.port = nodeConfig.port ?
        nodeConfig.port : global.nodeConfig.port;
  global.nodeConfig.onStart = nodeConfig.onStart ?
        nodeConfig.onStart : global.nodeConfig.onStart;
}

const distribution = {
  util: require('./distribution/util/util.js'),
  local: require('./distribution/local/local.js'),
  node: require('./distribution/local/node.js'),
};

global.distribution = distribution;

distribution['all'] = {};
distribution['all'].status =
    require('./distribution/all/status')({gid: 'all'});
distribution['all'].comm =
    require('./distribution/all/comm')({gid: 'all'});
distribution['all'].gossip =
    require('./distribution/all/gossip')({gid: 'all'});
distribution['all'].groups =
    require('./distribution/all/groups')({gid: 'all'});
distribution['all'].routes =
    require('./distribution/all/routes')({gid: 'all'});
distribution['all'].mem =
    require('./distribution/all/mem')({gid: 'all'});
distribution['all'].store =
    require('./distribution/all/store')({gid: 'all'});
module.exports = global.distribution;
global.nodesN = 3
if(args.nodes) {
  global.nodesN = args.nodes
}

function doCrawl(urls) {
  let r1 = (key, values) => {
    let obj = {};
    obj[key] = values;
    return obj;
  };
  const doMapReduce = () => {
    global.distribution.crawler.store.get(null, (e, v) => {
      if(v.length != 0) {
        global.distribution.crawler.mr.exec({keys: v, map: m1c, reduce: r1}, (e, v) => {
          if(v) {
            doMapReduce()
          }
          if(e) {
            console.log(e)
          }
        });
      } else {
        console.log("done crawling")
      }
    });
  };
  async function processFileLineByLine(filename) {
    const rl = readline.createInterface({
      input: fs.createReadStream(filename),
      crlfDelay: Infinity
    });
    let key = 0
    let toSend = []
    send = false
    for await (const line of rl) {
      // Assuming each line is in JSON format
      try {
        key+=1
        toSend.push(line)
        send = true
        if(key === SIZE) {
          send = false
          await new Promise((resolve, reject) => {
            distribution.crawler.store.put(toSend, key.toString(), (e, v) => {
              if (e) {
                console.log(e)
                reject(e);
              } else {
                resolve();
              }
            });
          });  
          toSend = []
        }
      } catch (error) {
        console.error('Error parsing line:', error);
      }
    }
    if(send) {
      distribution.crawler.store.put(toSend, key.toString(), (e, v) => {
        if (e) {
          console.log(e)
        }
      });
    }
    doMapReduce();
  }
  processFileLineByLine(urls)
}

async function doIndex() {
  called = 0
  let m1 =  async (key, value) => {
    called+=1
    try {
      function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      }
      async function fetchAndWriteToFile(url, filePath) {
          let toReturn =[];
          const apiKey = 'acc_2f42af2f6c1e0ac';
          const apiSecret = '1bf9962139729bd52076f679b70a5dca';
          const imageUrl = url;
          const apiUrl = decodeURIComponent(`https://api.imagga.com/v2/tags?image_url=${encodeURIComponent(imageUrl)}`);
            try {
                const response = await got(apiUrl, {username: apiKey, password: apiSecret});
                const content = JSON.parse(response.body).result.tags
                data = ''
                directory = process.cwd()
                for (let t of content) {
                  let filename = `${directory}/content/tags/${t.tag.en}.txt`;
                  try {
                    await new Promise((resolve, reject) => {
                      global.distribution.querier.store.get(t.tag.en, (error, value) => {
                          if (error) {
                            global.distribution.querier.store.put([imageUrl],t.tag.en, (e,v) => {
                              if(e) {
                                reject(e)
                              }
                              else {
                                resolve(v);
                              }
                            })    
                          } else {
                            global.distribution.querier.store.put([...value, imageUrl], t.tag.en, (e,v) =>
                            {
                              if(e) {
                                reject(e)
                              }
                              else{
                                resolve(v)
                              }
                            })
                          }
                      });
                  });
                  } catch (err) {
                      throw err; // Propagate other errors
                  }
                }
            } catch (error) {
              console.log(error.response.body)
            }
          ;
      }
      await fetchAndWriteToFile(value,"")
      toReturn =[]
      let obj = {}
      obj["merge"] = value
      toReturn.push(obj)
      return toReturn
    } catch (err) {
      console.log(err);
    }
  };
  let r1 = (key, values) => {
    let obj = {};
    obj[key] = values;
    return obj;
  };
  const doMapReduce = async () => {
    global.distribution.index.store.get(null, (e, v) => {
      new Promise((resolve, reject) => {
        global.distribution.index.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
      })
      });
    });
  };
  await doMapReduce()
}
function readNodes(filename) {
  const nodes = {}
  try {
    const fileContent = fs.readFileSync(filename, 'utf8');
    const lines = fileContent.split('\n');
    for(line of lines) {
      if (line.trim() === '') {
        continue;
    }
      splitted = line.split(":")
      node = {ip: splitted[0], port: splitted[1]}
      nodes[id.getSID(node)] = node
    }
    return nodes 
  } catch(err) {
    console.error("Error:", err);
  }
}
function writeToOrAppendFileSync(filename, content) {
  const nodes = {}
  try {
      const fileContent = fs.readFileSync(filename, 'utf8');
      const lines = fileContent.split('\n');
      for(line of lines) {
        if(line === content) {
          continue
        }
        if (line.trim() === '') {
          continue;
      }
        splitted = line.split(":")
        node = {ip: splitted[0], port: splitted[1]}
        nodes[id.getSID(node)] = node
        
      }
      splitted = content.split(":")
      node = {ip: splitted[0], port: splitted[1]}
      nodes[id.getSID(node)] = node
      fs.appendFileSync(filename, content + '\n');
      console.log("Content appended to the file successfully.");
      return nodes
  } catch (err) {
      console.error("Error:", err);
  }
}

// Usage example

/* The following code is run when distribution.js is run directly */
if (require.main === module) {
  const querierConfig = {gid: 'querier', hash: global.id.consistentHash};
  const crawlerConfig = {gid: 'crawler', hash: global.id.consistentHash};
  const indexConfig = {gid: 'index', hash: global.id.consistentHash};
  if(args.crawler) {
    global.nodeConfig.onStart =() => {
      nodes = writeToOrAppendFileSync("cnodes.txt", `${global.nodeConfig.ip}:${global.nodeConfig.port}`)
      console.log(nodes)
      groupsTemplate(crawlerConfig).put(crawlerConfig, nodes, (e,v) => {
        if(e) {
          console.log(e)

        }
      })
      indexNodes = readNodes("inodes.txt")
      console.log("reached1")

      groupsTemplate(indexConfig).put(indexConfig, indexNodes, (e,v) => {
        if(e) {
          console.log(e)
        }
      })
      console.log("reached2")
      remote = {service: "groups", method: "put"}
      try {
        global.distribution.index.comm.send([crawlerConfig,nodes], remote, (e,v) =>{
          if(e) {
            console.log(e)
  
          }
          })
      } catch(error) {
        console.log(error)
      }
    }
  }
  else if(args.indexer) {
    global.nodeConfig.onStart =() => {
      const nodes = writeToOrAppendFileSync("inodes.txt", `${global.nodeConfig.ip}:${global.nodeConfig.port}`)
      console.log(nodes)
      groupsTemplate(indexConfig).put(indexConfig, nodes, (e,v) => {
      })
      crawlerNodes = readNodes("cnodes.txt")
      groupsTemplate(crawlerConfig).put(crawlerConfig, crawlerNodes, (e,v) => {
      })
      try {
        remote = {service: "groups", method: "put"}
        console.log("reached")
        global.distribution.crawler.comm.send([indexConfig,nodes], remote, (e,v) =>{})
        console.log(nodes)
      } catch(error) {
        console.log(error)
      }
    }
  } else {
    global.nodeConfig.onStart =() => {
      nodes = writeToOrAppendFileSync("nodes.txt", `${global.nodeConfig.ip}:${global.nodeConfig.port}`)
      groupsTemplate(querierConfig).put(querierConfig, nodes, (e,v) => {  
      })
      groupsTemplate(indexConfig).put(indexConfig, nodes, (e,v) => {  
      })
      groupsTemplate(crawlerConfig).put(crawlerConfig, nodes, (e,v) => {
      })
    }
  
  }
    distribution.node.start(global.nodeConfig.onStart);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    // Function to handle command-line input
    function handleInput(input) {
      if(input.split(" ")[0] === "crawl") {
        doCrawl(input.split(" ")[1])
      }
      if(input.split(" ")[0] === "index") {
         doIndex()
      }
      if(input.split(" ")[0] === "query") {
        value = []
        global.distribution.querier.store.get(input.split(" ")[1], (e,v) => {
          if(e) {
            console.log("not found")
          }
        })
      }
    }
    // Listen for 'line' events (when user presses Enter)
    rl.on('line', handleInput);
}