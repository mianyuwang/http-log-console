(() => { // namespace
'use strict';
const alertq = require('./alert_queue');

const CATEGORY = "@LogStats";

class LogStats {
    /**
     * Constructor of log stats class
     * @param {Object} options 
     */
    constructor(log, options) {
        this.log = log;
        // option parameters
        let defaultOptions = {
            threshold: 10, // request per second
            span:      120, // how many seconds
            interval:  10, // dump interval in second
        };
        // merge defaultOption into customized options 
        this.options = {...defaultOptions, ...options};
        log.info(CATEGORY, "Initializing LogStats ...", this.options);
        // state
        this.totalCount = 0; // total count requested
        this.totalBytes = 0; // total bytes requested
        this.lastTimestamp = null; // last processed timestamp
        this.sectionCountInterval = new Map(); // hash table of section - count
        this.statusCountInterval = new Map(); // hash table of HTTP status code - count
        
        // Recurring timer to dump stats
        this.interval = setInterval(this.print.bind(this), this.options.interval * 1000);

        // alerting
        this.alertQueue = new alertq.AlertQueue(this.options.threshold,
                                                this.options.span,
                                                this.log);
        this.alertQueue.on('alert_on', data => {
            log.warn(CATEGORY, "# High traffic generated an alert - hits = " + data.triggeringHits +
                     ", rate = " + data.triggeringRate, "per second, triggered at", 
                     data.triggeringTime);
        });
        this.alertQueue.on('alert_off', data => {
            log.warn(CATEGORY, "# High traffic alert recovered - hits = " + data.triggeringHits +
                     ", rate = " + data.triggeringRate, "per second, triggered at", 
                     data.triggeringTime);
        });
    }
    /**
     * Dump the stats to stdout
     */
    print() {
        this.log.info(CATEGORY, "Print statistics:");
        console.log("  ============== STATS ==============");
        console.log("  | Total Hits =", this.totalCount);
        console.log("  | Total Bytes =", this.totalBytes);
        console.log("  | Last Log Received Time =", this.lastTimestamp);
        let mostHit = 0, mostHitSection = "";
        for (let [key, val] of this.sectionCountInterval) {
            if (val > mostHit) {
                mostHitSection = key;
                mostHit = val;
            }
        }
        console.log("  | In the last", this.options.interval, "seconds:");
        console.log("  |   Most Hit Section = '" + mostHitSection + "', Hits =", mostHit);
        this.sectionCountInterval.clear(); // reset the interval stat
        mostHit = 0;
        let mostHitStatus = "";
        for (let [key, val] of this.statusCountInterval) {
            if (val > mostHit) {
                mostHitStatus = key;
                mostHit = val;
            }
        }
        console.log("  |   Most Returned Status = " + mostHitStatus + ", Hits =", mostHit);
        this.statusCountInterval.clear(); // reset the interval stat
        console.log("  -----------------------------------");
    }
    /**
     * Ingest a single log line
     * @param {String} logline 
     */
    ingest(logline) {
        const log = this.log;
        let fields = [];
        // parsing the line by regex
        logline.replace(
            /(.*) (.*) (.*) \[(.*)\] \"(.*) (.*) (.*)\" (.*) (.*)/,
            (match, ip, ident, userid, time, method, url, protocol, status, size) => {
                fields.push({
                    ip: ip,
                    ident: ident,
                    userid: userid,
                    timestr: time,
                    method: method,
                    url: url,
                    protocol: protocol,
                    status: status,
                    size: size
                });
            });
        if (fields[0] === undefined) { return; } // ignore unmatched line
        log.debug(CATEGORY, "Ingesting", fields[0]);
        this.updateStats(fields[0]);
    }
    /**
     * Update stats by a new coming stat
     * @param {Object} curr stat object to be process
     */
    updateStats(curr) {
        const log = this.log;
        // TODO: check overflow
        this.totalCount ++;
        this.totalBytes += parseFloat(curr.size);

        // Parse the timestamp string
        this.lastTimestamp = new Date(
            curr.timestr.replace(
                /(\d+)\/(\w+)\/(\d+):(\d+:\d+:\d+) ([+-=]\d+)/,
                "$2 $1 $3 $4 $5"));
        log.debug(CATEGORY, "Parsing timestr", curr.timestr, "into", this.lastTimestamp);
        // and update alert
        this.alertQueue.push(this.lastTimestamp);
        
        // Section parsing after removing site domain name like http://a.b.c/
        let sections = curr.url.replace(/.*:\/\/\w+(\.\w+)+/, "").split('/'); 
        let secKey = "";
        if (sections.length >= 3) {
            secKey = sections[0] + "/" + sections[1];
        } else if (sections.length == 2) { // <root>/resource
            secKey = "/";
        } else {
            log.warn(CATEGORY, "No section parsed from", curr.url);
        }
        let sec = this.sectionCountInterval.get(secKey);
        this.sectionCountInterval.set(secKey, sec ? (sec+1) : 1);
        
        // Status code count in a map
        let scc = this.statusCountInterval.get(curr.status);
        this.statusCountInterval.set(curr.status, scc ? (scc+1) : 1);
    }
} // class LogStats

exports.LogStats = LogStats;
})(); // close namepace
