var path = require('path');
var tiny = require('./index.js').default;
var restore = require('./index.js').restore;
var program = require('commander');
var package = require(path.join(__dirname, 'package.json'));
program
    .version(package.version)
    .arguments('<source>')
    .description('compress source file or directory')
    .option('-i --no-cache', 'Ignore cache,force compress ')    
    .option('-r --resote', 'restore backup file if exist')
    .option('--no-backup', 'Do not backup files')
    .option('-b --batch <batch>', 'number of batch processing task. default 15')
    .action(function (source, opts) {
        if (!!opts.resote){
            restore(source);
        }else{
            tiny(source, !!opts.backup, !opts.cache, +opts.batch).then(function(){
                console.log('tiny all png files successful!')
            });
        }
    });
program.parse(process.argv);
