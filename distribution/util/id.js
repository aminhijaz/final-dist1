const assert = require('assert');
var crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function idToNum(id) {
  let n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}
function comparnid(a, b) {
  return a.nid - b.nid;
}

function consistentHash(kid, nids) {
    function idToNum(id) {
        let n = parseInt(id, 16);
        return n;
      }
      function comparnid(a, b) {
        return a.nid - b.nid;
      }
      
  nkid = idToNum(kid);
  l = [];
  let c = 0;
  for (const nid of nids) {
    const nnid = idToNum(nid);
    l.push({nid: nnid, b: c});
    c+=1;
  }
  l.push({nid: nkid, b: 0});
  l.sort(comparnid);
  for (let i=0; i<l.length; i++) {
    if (i === l.length-1) {
      return nids[l[0].b];
    } else if (l[i].nid === nkid) {
      return nids[l[i + 1].b];
    }
  }
}


function rendezvousHash(kid, nids) {
  l = [];
  let c =0;
  for (const nid of nids) {
    const concatenated = kid + nid;
    l.push({nid: idToNum(getID(concatenated)), b: c});
    c+=1;
  }
  const maxi = l.reduce((max, obj) => {
    return obj.nid > max.nid ? obj : max;
  });
  return nids[maxi.b];
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
  idToNum: idToNum,
  naiveHash: naiveHash,
  consistentHash: consistentHash,
  rendezvousHash: rendezvousHash,
};

