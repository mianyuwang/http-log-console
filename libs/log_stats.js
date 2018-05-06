(() => { // namespace
'use strict';
const CATEGORY = "@LogStats";

class LogStats {
    constructor(options) {
        console.log("[INFO]", CATEGORY, "Initializing LogStats");
    }

    ingest (logline) {
        console.log("[DEBUG]", CATEGORY, "Ingesting", logline);
    }
}

exports.LogStats = LogStats;
})(); // close namepace