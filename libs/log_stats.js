(() => { // namespace
'use strict';

const CATEGORY = "@LogStats";

class LogStats {
    /**
     * Constructor of log stats class
     * @param {Object} options 
     */
    constructor(options) {
        console.log("[INFO]", CATEGORY, "Initializing LogStats");
        let defaultOptions = {
            verbose: false,
            highTrafficThreshold: 10, // request per second
        };
        this.options = {...options, ...defaultOptions};
        // Stats
        this.totalCount = 0; // total count requested
        this.totalBytes = 0; // total bytes requested
        this.lastTimestamp = null; // last processed timestamp
        this.sectionCount = new Map(); // hash table of section - count
        this.statusCodeCount = new Map(); // hash table of HTTP status code - count

        // Recurring timer to dump stats
        this.interval = setInterval(this.dump.bind(this), 10000); // every 10s
    }
    /**
     * Dump the stats to stdout
     */
    dump() {
        console.log("[DEBUG]", CATEGORY, "Recurring event handler");
        console.log("Dumping statistics:", this.totalCount, this.sectionCount);
    }
    /**
     * Ingest one log line
     * @param {String} logline 
     */
    ingest(logline) {
        let fields = [];
        // parsing the line by regex
        logline.replace(
            /(.*) (.*) (.*) \[(.*)\] \"(.*) (.*) (.*)\" (.*) (.*)/,
            (match, ip, ident, userid, time, method, url, protocol, status, size) => {
                fields.push({
                    ip: ip,
                    ident: ident,
                    userid: userid,
                    time: time,
                    method: method,
                    url: url,
                    protocol: protocol,
                    status: status,
                    size: size
                });
            });
        if (fields[0] === undefined) { return; } // ignore unmatched line
        console.log("[DEBUG]", CATEGORY, "Ingesting", fields[0]);
        this.updateStats(fields[0]);
    }
    /**
     * Update stats by a new coming stat
     * @param {Object} curr stat object to be process
     */
    updateStats(curr) {
        // TODO: check overflow
        this.totalCount ++;
        this.totalBytes += curr.size;
        
        // Section parsing after removing site domain name
        let sections = curr.url.replace(/.*:\/\/\w+(\.\w+)+/, "").split('/'); 
        let secKey = "";
        if (sections.length >= 3) {
            secKey = sections[0] + "/" + sections[1] + "/";
        } else if (sections.length == 2) { // <root>/resource
            secKey = "/";
        } else {
            console.log("[WARN]", CATEGORY, "No section parsed from", curr.url);
        }
        let sec = this.sectionCount.get(secKey);
        this.sectionCount.set(secKey, sec ? (sec+1) : 1);
        
        // Status code count in a map
        let scc = this.statusCodeCount.get(curr.status);
        this.statusCodeCount.set(curr.status, scc ? (scc+1) : 1);
    }
} // class LogStats

exports.LogStats = LogStats;
})(); // close namepace
