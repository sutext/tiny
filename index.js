'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var fs = require('@sutxt/fs');
var path = require('path');
var https = require('https');
var cacheHome = path.join(__dirname, '.cache');
if (!fs.exist(cacheHome)) {
    fs.mkdir(cacheHome);
}
var options = {
    method: 'POST',
    hostname: 'tinypng.com',
    path: '/web/shrink',
    headers: {
        rejectUnauthorized: false,
        'Postman-Token': Date.now(),
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};
function upload(imgpath) {
    return new Promise(function(resolve, reject) {
        options.headers['Postman-Token'] = Date.now();
        var req = https.request(options, function(res) {
            res.on('data', function(buf) {
                var obj = JSON.parse(buf.toString());
                if (obj.error) {
                    reject(obj.error);
                } else {
                    resolve(obj);
                }
            });
        });
        req.write(fs.data(imgpath), 'binary');
        req.on('error', function(err) {
            reject(err);
        });
        req.end();
    });
}
function download(obj) {
    return new Promise(function(resolve, reject) {
        var options = new URL(obj.output.url);
        var req = https.request(options, function(res) {
            var body = '';
            res.setEncoding('binary');
            res.on('data', function(data) {
                body += data;
            });
            res.on('end', function() {
                resolve(body);
            });
        });
        req.on('error', function(err) {
            reject(err);
        });
        req.end();
    });
}
function compress(file, backup, nocache) {
    var stats = fs.stats(file);
    if (!stats.isFile()) {
        console.log('[' + file + ']', ' is not a file skip it!');
        return;
    }
    if (path.extname(file) != '.png') {
        console.log('[' + file + ']', ' is not an image skip it!');
        return;
    }
    if (stats.size >= 5200000) {
        console.log('[' + file + ']', ' size has already exceed 5M skip it!');
        return;
    }
    console.log('[' + file + ']', 'compress started');
    var dist = path.resolve(file);
    if (backup) {
        var obj = path.parse(dist);
        var backfile = path.join(obj.dir, obj.name + '_bak' + obj.ext);
        fs.cp(dist, backfile);
    }
    var cache = path.join(cacheHome, fs.crc(file));
    if (!nocache && fs.exist(cache)) {
        fs.cp(cache, dist);
        console.log('[' + file + ']', 'compressd use cache:', cache);
        return Promise.resolve(dist);
    }
    return upload(file)
        .then(function(obj) {
            console.log('[' + file + ']', 'compress ratio:', obj.output.ratio);
            return download(obj);
        })
        .then(function(data) {
            console.log('[' + file + ']', 'compress succeed');
            fs.write(dist, data, 'binary');
            fs.cp(dist, cache);
            return dist;
        })
        .catch(function(err) {
            console.warn('[' + file + ']', 'compress error:', err);
        });
}
exports.default = function(path, backup, nocache) {
    if (!fs.exist(path)) {
        throw new Error('File or directory not exist:' + path);
    }
    var stat = fs.stats(path);
    if (stat.isDirectory()) {
        var tasks = [];
        fs.dir(path).each(function(f) {
            if (!f.endsWith('_bak.png')) {
                var task = compress(f, backup, nocache);
                if (task) {
                    tasks.push(task);
                }
            }
        }, /(\.png)$/);
        return Promise.all(tasks);
    } else if (stat.isFile()) {
        return compress(path, backup, nocache);
    }
};
