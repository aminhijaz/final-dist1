//  ________________________________________
// / NOTE: You should use absolute paths to \
// | make sure they are agnostic to where   |
// | your code is running from! Use the     |
// \ `path` module for that purpose.        /
//  ----------------------------------------
//         \   ^__^
//          \  (oo)\_______
//             (__)\       )\/\
//                 ||----w |
//                 ||     ||
const path = require('path');
const store = {};
const serialization = require('../util/serialization');
const fs = require('fs/promises');
const {getNID} = require('../util/id');
const lib = require('../util/id');
const fetch = require('node-fetch');

function encodeUnicode(str) {
  
    // Convert the string into a UTF-8 encoded string
    return btoa(str);
}

function decodeUnicode(base64) {
    const bytes = atob(base64);
    const encodedStr = bytes.split('').map(function(char) {
        return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
    }).join('');

    return decodeURIComponent(encodedStr);
}


store.put = function(obj, id, callback) {
  if (id === null) {
    id = lib.getID(obj);
  }
  if (typeof id === 'string') {
    const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
    const directoryPath = path.join(__dirname, 'local', directoryName);
    const filePath = path.join(directoryPath, encodeUnicode(id));
    fs.access(directoryPath, fs.constants.F_OK)
        .then(() => {
        })
        .catch(() => {
          return fs.mkdir(directoryPath, {recursive: true});
        })
        .then(() => {
          return fs.writeFile(filePath, serialization.serialize(obj));
        })
        .then(() => {
          return callback(null, obj);
        })
        .catch((err) => {
          callback(new Error('put error'), null);
        });
  } else {
    if (id.key === null) {
      id.key = lib.getID(obj);
    }
    const newId = encodeUnicode(id.key)
    const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
    let directoryPath = path.join(__dirname, id.gid, directoryName);
    let filePath = path.join(directoryPath, newId);
    fs.access(directoryPath, fs.constants.F_OK)
        .then(() => {
        })
        .catch(() => {
          return fs.mkdir(directoryPath, {recursive: true});
        })
        .then(() => {
          return fs.writeFile(filePath, serialization.serialize(obj));
        })
        .then(() => {
          return callback(null, obj);
        })
        .catch((err) => {
          callback(new Error('put error'), null);
        });
  }
};

store.get = function(id, callback) {
  if (id === null) {
    const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
    const directoryPath = path.join(__dirname, 'local', directoryName);
    fs.readdir(directoryPath)
        .then((files) => {

          callback(null, files.map(function(e) { 
            return decodeUnicode(e);
          }));
        })
        .catch((err) => {
          callback(new Error('get error'), null);
        });
  }
  if (typeof id === 'string') {
        newId = encodeUnicode(id)

    const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
    const filePath = path.join(__dirname, 'local', directoryName, newId);
    fs.readFile(filePath, 'utf8')
        .then((fileContent) => {
          const parsedData = serialization.deserialize(fileContent);
          callback(null, parsedData);
        })
        .catch((err) => {
          callback(new Error('get error'), null);
        });
  } else if (id !== null) {
    if (id.key === null) {
      const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
      const directoryPath = path.join(__dirname, id.gid, directoryName);
      fs.readdir(directoryPath)
          .then((files) => {
            return callback(null, files.map(function(e) { 
                return decodeUnicode(e);
              }));
    
          })
          .catch((err) => {
            callback(null, []);
          });
    } else {
      newId = encodeUnicode(id.key)
      const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
      const filePath = path.join(__dirname, id.gid, directoryName, newId);
      fs.readFile(filePath, 'utf8')
          .then((fileContent) => {
            const parsedData = serialization.deserialize(fileContent);
            callback(null, parsedData);
          })
          .catch((err) => {
            callback(new Error('get error'), null);
          });
    }
  }
};
store.del = function(id, callback) {
  if (id === null) {
    return callback(new Error('can\'t be null'), null);
  }

  if (typeof id === 'string') {
        newId = encodeUnicode(id)

    const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
    const filePath = path.join(__dirname, 'local', directoryName, newId);
    let deletedObj;
    fs.readFile(filePath, 'utf8')
        .then((fileContent) => {
          deletedObj = serialization.deserialize(fileContent);
          return fs.unlink(filePath);
        })
        .then(() => {
          return callback(null, deletedObj);
        })
        .catch((err) => {
          callback(new Error('delete error'), null);
        });
  } else {
    if (id.key === null) {
      return callback(new Error('can\'t be null'), null);
    }
    newId = encodeUnicode(id.key)
    const directoryName = getNID(global.nodeConfig).replace(/\W/g, '');
    const filePath = path.join(__dirname, id.gid, directoryName, newId);
    let deletedObj;
    fs.readFile(filePath, 'utf8')
        .then((fileContent) => {
          deletedObj = serialization.deserialize(fileContent);
          return fs.unlink(filePath);
        })
        .then(() => {
          return callback(null, deletedObj);
        })
        .catch((err) => {
          callback(new Error('delete error'), null);
        });
  }
};
module.exports = store;

