// global.nodeConfig = {ip: '127.0.0.1', port: 7070};
// const distribution = require('../distribution');
// const id = distribution.util.id;

// const groupsTemplate = require('../distribution/all/groups');
// const fetch = require('node-fetch');
// const fs = require('fs');
// const path = require('path');

// const ncdcGroup = {};
// const dlibGroup = {};
// const urlGroup = {};
// const iNGroup = {};
// const wbGroup ={};
// const memCompact = {};
// /*
//    This hack is necessary since we can not
//    gracefully stop the local listening node.
//    The process that node is
//    running in is the actual jest process
// */
// let localServer = null;

// /*
//     The local node will be the orchestrator.
// */

// const n1 = {ip: '127.0.0.1', port: 7110};
// const n2 = {ip: '127.0.0.1', port: 7111};
// const n3 = {ip: '127.0.0.1', port: 7112};

// beforeAll((done) => {
//   /* Stop the nodes if they are running */

//   ncdcGroup[id.getSID(n1)] = n1;
//   ncdcGroup[id.getSID(n2)] = n2;
//   ncdcGroup[id.getSID(n3)] = n3;

//   dlibGroup[id.getSID(n1)] = n1;
//   dlibGroup[id.getSID(n2)] = n2;
//   dlibGroup[id.getSID(n3)] = n3;

//   urlGroup[id.getSID(n1)] = n1;
//   urlGroup[id.getSID(n2)] = n2;
//   urlGroup[id.getSID(n3)] = n3;

//   iNGroup[id.getSID(n1)] = n1;
//   iNGroup[id.getSID(n2)] = n2;
//   iNGroup[id.getSID(n3)] = n3;

//   wbGroup[id.getSID(n1)] = n1;
//   wbGroup[id.getSID(n2)] = n2;
//   wbGroup[id.getSID(n3)] = n3;

//   memCompact[id.getSID(n1)] = n1;
//   memCompact[id.getSID(n2)] = n2;
//   memCompact[id.getSID(n3)] = n3;


//   const startNodes = (cb) => {
//     distribution.local.status.spawn(n1, (e, v) => {
//       distribution.local.status.spawn(n2, (e, v) => {
//         distribution.local.status.spawn(n3, (e, v) => {
//           cb();
//         });
//       });
//     });
//   };

//   distribution.node.start((server) => {
//     localServer = server;

//     const ncdcConfig = {gid: 'crawler'};
//     startNodes(() => {
//       groupsTemplate(ncdcConfig).put(ncdcConfig, ncdcGroup, (e, v) => {
//         const dlibConfig = {gid: 'stringmatch'};
//         groupsTemplate(dlibConfig).put(dlibConfig, dlibGroup, (e, v) => {
//           const urlConfig = {gid: 'urls'};
//           groupsTemplate(urlConfig).put(urlConfig, urlGroup, (e, v) => {
//             const iNconfig = {gid: 'in'};
//             groupsTemplate(iNconfig).put(iNconfig, iNGroup, (e, v) => {
//               const wbConfig = {gid: 'wb'};
//               groupsTemplate(wbConfig).put(wbConfig, wbGroup, (e, v) => {
//                 const mcConfig = {gid: 'mc'};
//                 groupsTemplate(mcConfig).put(mcConfig, memCompact, (e, v) => {
//                   done();
//                 });
//               });
//             },
//             );
//           });
//         });
//       });
//     });
//   });
// });

// afterAll((done) => {
//   let remote = {service: 'status', method: 'stop'};
//   remote.node = n1;
//   distribution.local.comm.send([], remote, (e, v) => {
//     remote.node = n2;
//     distribution.local.comm.send([], remote, (e, v) => {
//       remote.node = n3;
//       distribution.local.comm.send([], remote, (e, v) => {
//         localServer.close();
//         done();
//       });
//     });
//   });
// });

// function sanityCheck(mapper, reducer, dataset, expected, done) {
//   let mapped = dataset.map((o) =>
//     mapper(Object.keys(o)[0], o[Object.keys(o)[0]]));
//   /* Flatten the array. */
//   mapped = mapped.flat();
//   let shuffled = mapped.reduce((a, b) => {
//     let key = Object.keys(b)[0];
//     if (a[key] === undefined) a[key] = [];
//     a[key].push(b[key]);
//     return a;
//   }, {});
//   let reduced = Object.keys(shuffled).map((k) => reducer(k, shuffled[k]));

//   try {
//     expect(reduced).toEqual(expect.arrayContaining(expected));
//   } catch (e) {
//     done(e);
//   }
// }
// test('(25 pts) test workflow crawler', (done) => {
//   // checked that 000.txt get populated.
//   async function fetchAndWriteToFile(url, filePath) {
//     try {
//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const content = await response.text();
//       await fs.writeFile(filePath, content, 'utf8');
//     } catch (error) {
//     }
//   }

//   let m1 = (key, value) => {
//     try {
//       fetchAndWriteToFile(value, path.join(__dirname, key + '.txt'));
//     } catch (err) {
//       console.log(err);
//     }
//     let obj = {};
//     obj[key] = value;
//     return obj;
//   };
//   let r1 = (key, values) => {
//     let obj = {};
//     obj[values[0]] = 1;
//     return obj;
//   };
//   let dataset = [
//     {'000': 'https://www.google.com'},
//   ];
//   // this means that this url was crawled {url: 1}
//   let expected = [{'https://www.google.com': 1}];

//   /* Sanity check: map and reduce locally */
//   sanityCheck(m1, r1, dataset, expected, done);
//   /* Now we do the same thing but on the cluster */
//   const doMapReduce = (cb) => {
//     distribution.crawler.store.get(null, (e, v) => {
//       try {
//         expect(v.length).toBe(1);
//       } catch (e) {
//         done(e);
//       }
//       distribution.crawler.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
//         try {
//           expect(v).toEqual(expect.arrayContaining(expected));
//           done();
//         } catch (e) {
//           done(e);
//         }
//       });
//     });
//   };

//   let cntr = 0;

//   // We send the dataset to the cluster
//   dataset.forEach((o) => {
//     let key = Object.keys(o)[0];
//     let value = o[key];
//     distribution.crawler.store.put(value, key, (e, v) => {
//       cntr++;
//       // Once we are done, run the map reduce
//       if (cntr === dataset.length) {
//         doMapReduce();
//       }
//     });
//   });
// });

// test('(25 pts) test distributed string matching', (done) => {
//   let m1 = (key, value) => {
//     if (/^([a-z0-9]{5,})$/.test(value)) {
//       return {'': value};
//     } else {
//       return {'': ''};
//     }
//   };
//   let r1 = (key, values) => {
//     values = values.filter((n) => n != '');
//     return values;
//   };
//   let dataset = [
//     {'000': 'abc'},
//     {'318': 'abc123'},
//     {'424': 'abc123'},
//   ];
//   let expected = [['abc123', 'abc123']];

//   /* Sanity check: map and reduce locally */
//   sanityCheck(m1, r1, dataset, expected, done);
//   /* Now we do the same thing but on the cluster */
//   const doMapReduce = (cb) => {
//     distribution.stringmatch.store.get(null, (e, v) => {
//       try {
//         expect(v.length).toBe(3);
//       } catch (e) {
//         done(e);
//       }
//       distribution.stringmatch.mr.exec({keys: v, map: m1,
//         reduce: r1}, (e, v) => {
//         try {
//           expect(v).toEqual(expect.arrayContaining(expected));
//           done();
//         } catch (e) {
//           done(e);
//         }
//       });
//     });
//   };

//   let cntr = 0;

//   // We send the dataset to the cluster
//   dataset.forEach((o) => {
//     let key = Object.keys(o)[0];
//     let value = o[key];
//     distribution.stringmatch.store.put(value, key, (e, v) => {
//       cntr++;
//       // Once we are done, run the map reduce
//       if (cntr === dataset.length) {
//         doMapReduce();
//       }
//     });
//   });
// });

// test('(25 pts) test url extract', (done) => {
//   // urls.txt gets populated
//   let m1 = (key, value) => {
//     const data = fs.readFileSync(value,
//         {encoding: 'utf8', flag: 'r'});
//     var urlRegex = /https?:\/\/[^\s]+/g;
//     var urls = data.match(urlRegex);
//     return {'url': urls};
//   };
//   let r1 = (key, values) => {
//     const uniquevalues = [...new Set(values)];
//     const data = uniquevalues.join('\n');
//     fs.writeFileSync(path.join(__dirname, 'urls.txt'), data,
//         {encoding: 'utf8'});
//     return uniquevalues;
//   };

//   let dataset = [
//     {'000': path.join(__dirname, '000.txt')},
//   ];
//   let expected = [[['http://schema.org/WebPage"', 'https://www.google.com/imghp?hl=en&tab=wi">Images</a>', 'https://maps.google.com/maps?hl=en&tab=wl">Maps</a>', 'https://play.google.com/?hl=en&tab=w8">Play</a>', 'https://www.youtube.com/?tab=w1">YouTube</a>', 'https://news.google.com/?tab=wn">News</a>', 'https://mail.google.com/mail/?tab=wm">Gmail</a>', 'https://drive.google.com/?tab=wo">Drive</a>', 'https://www.google.com/intl/en/about/products?tab=wh"><u>More</u>', 'http://www.google.com/history/optout?hl=en"', 'https://accounts.google.com/ServiceLogin?hl=en&passive=true&continue=https://www.google.com/&ec=GAZAAQ"']]];

//   /* Sanity check: map and reduce locally */
//   sanityCheck(m1, r1, dataset, expected, done);
//   /* Now we do the same thing but on the cluster */
//   const doMapReduce = (cb) => {
//     distribution.urls.store.get(null, (e, v) => {
//       try {
//       } catch (e) {
//         done(e);
//       }
//       distribution.urls.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
//         try {
//           done();
//         } catch (e) {
//           done(e);
//         }
//       });
//     });
//   };

//   let cntr = 0;

//   // We send the dataset to the cluster
//   dataset.forEach((o) => {
//     let key = Object.keys(o)[0];
//     let value = o[key];
//     distribution.urls.store.put(value, key, (e, v) => {
//       cntr++;
//       // Once we are done, run the map reduce
//       if (cntr === dataset.length) {
//         doMapReduce();
//       }
//     });
//   });
// });
// test('(25 pts) test inverted index workflow', (done) => {
//   let m1 = (key, value) => {
//     const tokens = value.toLowerCase().match(/\w+/g) || [];
//     toReturn = new Set();
//     for (token of tokens) {
//       obj = {};
//       obj[token] = key;
//       toReturn.add(obj);
//     }
//     return Array.from(toReturn);
//   };
//   let r1 = (key, values) => {
//     obj = {};
//     obj[key] = values;
//     return obj;
//   };
//   let dataset = [
//     {'file1': 'Hello, How are you?'},
//     {'file2': 'How is the weather?'},
//     {'file3': 'Is it good?'},
//   ];
//   let expected = [{'hello': ['file1']},
//     {'how': ['file1', 'file2']}, {'are': ['file1']},
//     {'you': ['file1']}, {'is': ['file2', 'file3']},
//     {'the': ['file2']}, {'weather': ['file2']},
//     {'it': ['file3']}, {'good': ['file3']}];

//   /* Sanity check: map and reduce locally */
//   sanityCheck(m1, r1, dataset, expected, done);
//   /* Now we do the same thing but on the cluster */
//   const doMapReduce = (cb) => {
//     distribution.in.store.get(null, (e, v) => {
//       try {
//       } catch (e) {
//         done(e);
//       }
//       distribution.in.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
//         try {
//           done();
//         } catch (e) {
//           done(e);
//         }
//       });
//     });
//   };

//   let cntr = 0;

//   // We send the dataset to the cluster
//   dataset.forEach((o) => {
//     let key = Object.keys(o)[0];
//     let value = o[key];
//     distribution.in.store.put(value, key, (e, v) => {
//       cntr++;
//       // Once we are done, run the map reduce
//       if (cntr === dataset.length) {
//         doMapReduce();
//       }
//     });
//   });
// });
// test('(25 pts) test inverted web graph', (done) => {
//   let m1 = (key, value) => {
//     const data = fs.readFileSync(value,
//         {encoding: 'utf8', flag: 'r'});
//     var urlRegex = /https?:\/\/[^\s]+/g;
//     var urls = data.match(urlRegex);
//     l = new Set();
//     for (u of urls) {
//       obj = {};
//       obj[u] = key;
//       l.add(obj);
//     }
//     return Array.from(l);
//   };
//   let r1 = (key, values) => {
//     obj = {};
//     obj[key] = values;
//     return obj;
//   };
//   let dataset = [
//     {'google.com': path.join(__dirname, '000.txt')},
//     {'google1.com': path.join(__dirname, '000.txt')},

//   ];
//   let expected = [{'http://schema.org/WebPage"': ['google.com', 'google1.com']}, {'https://www.google.com/imghp?hl=en&tab=wi">Images</a>': ['google.com', 'google1.com']}, {'https://maps.google.com/maps?hl=en&tab=wl">Maps</a>': ['google.com', 'google1.com']}, {'https://play.google.com/?hl=en&tab=w8">Play</a>': ['google.com', 'google1.com']}, {'https://www.youtube.com/?tab=w1">YouTube</a>': ['google.com', 'google1.com']}, {'https://news.google.com/?tab=wn">News</a>': ['google.com', 'google1.com']}, {'https://mail.google.com/mail/?tab=wm">Gmail</a>': ['google.com', 'google1.com']}, {'https://drive.google.com/?tab=wo">Drive</a>': ['google.com', 'google1.com']}, {'https://www.google.com/intl/en/about/products?tab=wh"><u>More</u>': ['google.com', 'google1.com']}, {'http://www.google.com/history/optout?hl=en"': ['google.com', 'google1.com']}, {'https://accounts.google.com/ServiceLogin?hl=en&passive=true&continue=https://www.google.com/&ec=GAZAAQ"': ['google.com', 'google1.com']}];

//   /* Sanity check: map and reduce locally */
//   sanityCheck(m1, r1, dataset, expected, done);
//   /* Now we do the same thing but on the cluster */
//   const doMapReduce = (cb) => {
//     distribution.wb.store.get(null, (e, v) => {
//       try {
//       } catch (e) {
//         done(e);
//       }
//       distribution.wb.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
//         try {
//           done();
//         } catch (e) {
//           done(e);
//         }
//       });
//     });
//   };

//   let cntr = 0;

//   // We send the dataset to the cluster
//   dataset.forEach((o) => {
//     let key = Object.keys(o)[0];
//     let value = o[key];
//     distribution.wb.store.put(value, key, (e, v) => {
//       cntr++;
//       // Once we are done, run the map reduce
//       if (cntr === dataset.length) {
//         doMapReduce();
//       }
//     });
//   });
// });
