(() => { // namespace
'use strict';
const lobs   = require('./libs/log_observer');
const lstats = require('./libs/log_stats');

// TODO: Use a commandline parser
let filename = process.argv[2];
console.log("Starting HTTP Log Console ... file =", filename);

// Init LogObserver object
let logObserver = null;
try {
    logObserver = new lobs.LogObserver(filename);
} catch (err) {
    console.log("Failed to start, error = \"" + err + "\"");
    process.exit(1);
}

// Init LogStats object
const logStats = new lstats.LogStats({});
// Bind event handler
logObserver.on('line', (data) => {
    console.log("[DEBUG] console line event:", data);
    logStats.ingest(data);
});
logObserver.startWatch();

})(); // close namespace
