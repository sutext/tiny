var path = require('path');
var tiny = require('./index.js').default;
var program = require('commander');
var package = require(path.join(__dirname, 'package.json'));
program
    .version(package.version)
    .arguments('<source>')
    .description('compress source file or directory')
    .option('-b --backup', 'need backup origin image files')
    .option('-f --no-cache', 'force compress ignore cache.')
    .option('--batch <batch>', 'number of batch processing task. default 15')
    .action(function (source, opts) {
        tiny(source, !!opts.backup, !opts.cache, opts.batch);
    });
program.parse(process.argv);
