'use strict';

function LogStats(config) {
    console.log("[DEBUG] Initializing LogStats");
}

LogStats.prototype.ingest = function(logline) {
    console.log("[DEBUG] Ingesting", logline);
};

exports.LogStats = LogStats;
