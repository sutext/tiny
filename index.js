'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var fs = require('@sutext/fs');
var path = require('path');
var https = require('https');
var cacheHome = path.join(__dirname, '.cache');
if (!fs.exist(cacheHome)) {
    fs.mkdir(cacheHome);
}
var backupHome = path.join(__dirname, '.backup');
if (!fs.exist(backupHome)) {
    fs.mkdir(backupHome);
}
function genOptions(){
    return {
        method: 'POST',
        hostname: 'tinypng.com',
        path: '/web/shrink',
        headers: {
            rejectUnauthorized: false,
            'Postman-Token': Date.now(),
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        },
    };
}
function getCacheFile(file) {
    var filePathHash = fs.crc(Buffer.from(file,'utf-8'));
    var fileContentHash = fs.crc(file);
    return path.join(cacheHome,`${filePathHash}-${fileContentHash}`);
}
function getBackupFile(file){
    var filePathHash = fs.crc(Buffer.from(file,'utf-8'));
    return path.join(backupHome,filePathHash);
}
function isNeedCompress(file, backup, nocache){
    var stats = fs.stats(file);
    if (!stats.isFile()) {
        console.log('[' + file + ']', ' is not a file skip it!');
        return false;
    }
    if (path.extname(file) != '.png') {
        console.log('[' + file + ']', ' is not an image skip it!');
        return false;
    }
    if (stats.size >= 5200000) {
        console.log('[' + file + ']', ' size has already exceed 5M skip it!');
        return false;
    }
    var cacheFile = getCacheFile(file);
    if (!nocache && fs.exist(cacheFile)) {
        var dist = path.resolve(file);
        fs.cp(cacheFile,dist);
        if (backup) {
            fs.cp(dist, getBackupFile(file));
        }
        console.log('[' + file + ']', 'compressd use cache:', cacheFile);
        return false;
    }
    return true
}
function upload(imgpath) {
    return new Promise(function (resolve, reject) {
        var req = https.request(genOptions(), function (res) {
            var body = '';
            res.on('data', function (buf) {
                body += buf;
            });
            res.on('end', function () {
                var obj = JSON.parse(body.toString());
                if (obj.error) {
                    reject(obj.error);
                } else {
                    resolve(obj);
                }
            });
            res.on('error', function (err) {
                reject(err);
            });
        });
        req.write(fs.data(imgpath), 'binary');
        req.on('error', function (err) {
            reject(err);
        });
        req.end();
    });
}
function download(obj) {
    return new Promise(function (resolve, reject) {
        var req = https.request(new URL(obj.output.url), function (res) {
            var body = '';
            res.setEncoding('binary');
            res.on('data', function (data) {
                body += data;
            });
            res.on('end', function () {
                resolve({ ratio: obj.output.ratio, data: body });
            });
            res.on('error', function (err) {
                reject(err);
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
        req.end();
    });
}
function compress(file, backup, nocache) {
    console.log('[' + file + ']', 'processing started');
    return upload(file)
        .then(function (obj) {
            return download(obj);
        })
        .then(function (obj) {
            var dist = path.resolve(file);
            if (backup) {
                fs.cp(dist, getBackupFile(file));
            }
            fs.write(dist, obj.data, 'binary');
            if (!nocache) {
                fs.cp(dist, getCacheFile(file));
            }
            console.log('[' + file + ']', 'compress succeed ratio:', obj.ratio);
            return dist;
        })
        .catch(function (err) {
            console.error('[' + file + ']', err);
            throw err;
        });
}
function batch(files, backup, nocache) {
    var tasks = [];
    files.forEach(function (f) {
        var task = compress(f, backup, nocache);
        if (task) {
            tasks.push(task);
        }
    });
    return new Promise(function (resolve, reject) {
        Promise.all(tasks).then(function(args) {
            setTimeout(function(){
                resolve(args)
            }, 60000);
        }).catch(reject)
    })
}
exports.default = function (filePath, backup, nocache, size) {
    if (!fs.exist(filePath)) {
        throw new Error('File or directory not exist:' + filePath);
    }
    var stat = fs.stats(filePath);
    if (stat.isDirectory()) {
        return new Promise(function (resolve, reject) {
            var files = [];
            fs.dir(filePath).each(function (f) {
                if (isNeedCompress(f,backup,nocache)) {
                    files.push(f);
                }
            }, /(\.png)$/);
            size = (typeof size === 'number' && size > 0 && size < 25 && size) || 15;
            console.log('There are ' + files.length + 'files to be compress!');
            function start() {
                var bs = files.splice(0, size);
                if (bs.length > 0) {
                    console.log('Start to processing ' + bs.length + 'files ...');
                    console.log('There are ' + files.length + ' files left in the waiting queue ...');
                    batch(bs, backup, nocache).then(start).catch(reject);
                } else {
                    resolve();
                }
            }
            start();
        });
    } else if (stat.isFile()) {
        return compress(filePath, backup, nocache);
    }
};
exports.restore = function(filePath){
    if (!fs.exist(filePath)) {
        throw new Error('File or directory not exist:' + filePath);
    }
    var stat = fs.stats(filePath);
    if (stat.isDirectory()) {
        fs.dir(filePath).each(function (f) {
            var backFile = getBackupFile(f)
            if (fs.exist(backFile)) {
                fs.cp(backFile,path.resolve(f))
            }
        }, /(\.png)$/);
    } else if (stat.isFile()) {
        var backFile = getBackupFile(filePath)
        if (fs.exist(backFile)) {
            fs.cp(backFile,path.resolve(filePath))
        }
    }
}