(() => { // namespace
'use strict';
const lobs   = require('log_observer');
const lstats = require('log_stats');
const CATEGORY = "@Console";

// TODO: Use a commandline parser
//       Use a professional logger library
let filename = process.argv[2];
console.log("[INFO]", CATEGORY, "Starting HTTP Log Console ... file =", filename);

// Create LogObserver object
let logObserver = null;
try {
    logObserver = new lobs.LogObserver(filename);
} catch (err) {
    console.log("[ERROR]", CATEGORY, "Failed to start, error = \"" + err + "\"");
    process.exit(1);
}

// Create LogStats object
const logStats = new lstats.LogStats({});

// Bind handler on line event
logObserver.on('line', (data) => {
    console.log("[DEBUG]", CATEGORY, "LogObserver line event:", data);
    logStats.ingest(data);
});

// And start watching
logObserver.startWatch();

})(); // close namespace
