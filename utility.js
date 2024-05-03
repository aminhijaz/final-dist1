'use strict';

const fs = require('fs');
const visited = (url) => {
    const data = fs.readFileSync("visited1.txt", 'utf8');
    const lines = data.split('\n');
    for(line of lines) {
        if(line === url) {
            return true
        }
    }
    const fileLine = url + '\n'

    fs.appendFileSync("visited1.txt", fileLine, (err) => {
        if (err) {
            console.error(err);
        }
    });
}



module.exports.visited = visited;
