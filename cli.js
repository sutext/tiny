var path = require('path');
var tiny = require('./index.js').default;
var restore = require('./index.js').restore;
var program = require('commander');
var package = require(path.join(__dirname, 'package.json'));
program
    .version(package.version)
    .arguments('<source>')
    .description('compress source file or directory')
    .option('-b --backup', 'need backup origin image files')
    .option('-i --no-cache', 'force compress ignore cache.')    
    .option('-r --resote', 'restore backup file if exist')
    .option('--batch <batch>', 'number of batch processing task. default 15')
    .action(function (source, opts) {
        if (!!opts.resote){
            restore(source);
        }else{
            tiny(source, !!opts.backup, !opts.cache, opts.batch);
        }
    });
program.parse(process.argv);
