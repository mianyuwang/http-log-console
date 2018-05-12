(() => { // namespace
'use strict';
const fs = require('fs');
const program = require('commander');

// Parse command line arguments
program
    .version('1.0.0')
    .usage('[options] <file>')
    .option('-v, --verbose', "Be verbose")
    .option('-r, --rate <n>', "The rate generating mock logs", 1)
    .parse(process.argv);

let fstream = undefined;
if (program.args[0] === undefined) {
    console.log("Please provide the filename");
    process.exit(1);
} else {
    fstream = fs.createWriteStream(program.args[0], {flags: 'a'});
}

// Test log lines
let test = [
    '104.106.255.68 - alpha [TimePlaceholder] "GET /index.html HTTP/1.0" 100 728',
    '104.106.255.68 - - [TimePlaceholder] "GET /newyork/tribeca.html HTTP/1.0" 101 2336',
    '104.106.31.68 - alpha [TimePlaceholder] "GET /newyork/centralpark.html HTTP/1.0" 100 2336',
    '104.106.45.68 - - [TimePlaceholder] "GET /newyork/timesquare.html HTTP/1.0" 200 2336',
    '104.106.45.68 user alpha [TimePlaceholder] "GET /newyork/brooklyn.html HTTP/1.0" 101 2336',
    '172.217.13.68 - beta [TimePlaceholder] "PUT /london/wes/view.html HTTP/1.1" 201 987',
    '172.217.13.68 - - [TimePlaceholder] "GET /london/wes/view.html HTTP/1.1" 200 1220',
    '31.13.71.36 - gamma [TimePlaceholder] "GET /tokyo/shijuku/res.html HTTP/1.1" 202 280',
    '31.13.71.36 - - [TimePlaceholder] "GET /tokyo/shijuku/res.html HTTP/1.1" 200 280',
    '31.13.71.36 - gamma [TimePlaceholder] "GET /shanghai/des.html HTTP/1.1" 206 812',
];
setInterval(() => {
    let now = new Date()
                .toString()
                .replace(/\S+ (\S+) (\d+) (\d+) (\d{2}:\d{2}:\d{2}) GMT(-\d+) .*/, "$2/$1/$3:$4 $5");
    let randLine = test[~~(Math.random() * test.length)].replace(/TimePlaceholder/, now); 
    if (program.verbose) console.log(randLine);
    fstream.write(randLine + '\n');
}, (1 / parseInt(program.rate)) * 1000);

})(); // close namespace