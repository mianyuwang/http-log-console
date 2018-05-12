(() => { // namespace
'use strict';

const lobs   = require('./src/log_observer');
const lstats = require('./src/log_stats');
const program = require('commander');
const Logger = require('basic-logger');

const CATEGORY = "@Console";

// Parse command line arguments
program
    .version('1.0.0')
    .usage('[options] <file>')
    .option('-v, --verbose', "Print verbose logs")
    .option('-t, --threshold <n>', "High traffic alert threshold, default to 10 per second", parseInt, 10)
    .option('-s, --span <n>', "High traffic alert span, default to 120 seconds", parseInt, 120)
    .option('-i, --interval <n>', "Stats spew interval in seconds, default to 10 seconds", parseInt, 10)
    .parse(process.argv);

// Create logger
if (program.verbose) {
    Logger.setLevel('debug');
} else {
    Logger.setLevel('info');
}
let log = new Logger({ showMillis: false, showTimestamp: true });

let filename = program.args[0];
log.info(CATEGORY, "Starting HTTP Log Console ... file = '" + filename + "'");

// Create LogObserver object
let logObserver = null;
try {
    logObserver = new lobs.LogObserver(filename, log);
} catch (err) {
    log.error(CATEGORY, "Failed to start, error = '" + err + "'");
    process.exit(1);
}

// Create LogStats object
const logStats = new lstats.LogStats(log, {
    threshold: program.threshold,
    span: program.span,
    interval: program.interval,
});

// Bind handler on line event
logObserver.on('line', (data) => {
    log.debug(CATEGORY, "LogObserver line event:", data);
    logStats.ingest(data);
});

// And start watching
logObserver.startWatch();

})(); // close namespace
