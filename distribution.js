#!/usr/bin/env node

const util = require('./distribution/util/util.js');
const args = require('yargs').argv;
const groupsTemplate = require('./distribution/all/groups');
const fs = require('fs');
global.fs = fs

const readline = require('readline');
const id = require("./distribution/util/id.js")
const path = require('path');    
const { availableParallelism } = require('os');
global.fetch = require("node-fetch")
global.cheerio = require('cheerio');
global.axios = require('axios')
global.path = path
const got = require('got'); // if you don't have "got" - install it with "npm install got"
global.got = got
// Default configuration
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
  let m1 = (key, value) => {
    try {
      async function fetchAndWriteToFile(url, filePath) {
        console.log(filePath)
        try {
          const response = await global.fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const content = await response.text();
          const $ = global.cheerio.load(content);
          const images = $('img');
          // Extract src attribute from each image element
        
          images.each(async (index, element) => {
            let imageUrl = $(element).attr('src');
            if (imageUrl) {
                // Check if the URL is relative, and if so, prepend it with the base URL
                if (!/^(?:[a-z+]+:)?\/\//i.test(imageUrl)) {
                    imageUrl = new URL(imageUrl, url).href;
                }
                  distribution.index.store.put(imageUrl, null,  (e, v) => {
                  });
            }
        });
        } catch (error) {
          console.log(error)
        }
      }
      const directory = process.cwd(); // Get the current working directory
      console.log(`${directory}/${key}.txt`)
      fetchAndWriteToFile(value, `${directory}/content/${key}.txt`);
    } catch (err) {
      console.log(err);
    }
    let obj = {};
    obj["merge"] = value;
    return obj;
  };
  let r1 = (key, values) => {
    let obj = {};
    obj[key] = values;
    return obj;
  };
  const doMapReduce = () => {
    global.distribution.crawler.store.get(null, (e, v) => {
      global.distribution.crawler.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
      });
    });
  };
  async function processFileLineByLine(filename) {
    const rl = readline.createInterface({
      input: fs.createReadStream(filename),
      crlfDelay: Infinity
    });
    let key = 0
    for await (const line of rl) {
      // Assuming each line is in JSON format
      try {
        key+=10
        let value = line
        await new Promise((resolve, reject) => {
          // Assuming distribution.crawler.store.put is defined elsewhere
          distribution.crawler.store.put(value, key.toString(), (e, v) => {
            if (e) {
              console.log(e)
              reject(e);
            } else {
              resolve();
            }
          });
        });
      } catch (error) {
        console.error('Error parsing line:', error);
      }
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
                console.log("content")
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
      console.log("out")
      new Promise((resolve, reject) => {
        global.distribution.index.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
      })
      });
    });
  };
  await doMapReduce()
}

/* The following code is run when distribution.js is run directly */
if (require.main === module) {
  global.nodeConfig.onStart =() => {
    const querierConfig = {gid: 'querier'};
    groupsTemplate(querierConfig).add(querierConfig, global.nodeConfig, (e,v) => {
      const crawlerConfig = {gid: 'crawler'};

      groupsTemplate(crawlerConfig).add(crawlerConfig,global.nodeConfig, (e,v) => {
        const indexConfig = {gid: 'index'};
        groupsTemplate(indexConfig).add(indexConfig,global.nodeConfig, (e,v) => {
          if(e) {
            newGroup = {}
            newGroup[id.getSID(global.nodeConfig)] = global.nodeConfig
            groupsTemplate(indexConfig).put(indexConfig, newGroup, (e,v) => {  
          })
        }
      })
        if(e) {
          newGroup = {}
          newGroup[id.getSID(global.nodeConfig)] = global.nodeConfig
          groupsTemplate(crawlerConfig).put(crawlerConfig, newGroup, (e,v) => {
          })
        }
      })
      if(e) {
        newGroup = {}
        newGroup[id.getSID(global.nodeConfig)] = global.nodeConfig
        groupsTemplate(querierConfig).put(querierConfig, newGroup, (e,v) => {  
        })
      }
    })
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
