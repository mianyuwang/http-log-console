(() => { // namespace
'use strict';
const events = require('events');

const CATEGORY = "@AlertQueue";
/**
 * A queue of buckets, each contains tuples of
 * [timestamp, count] - # of logs in this timestamp, in unit of second
 * e.g. [1525902920, 7] -> [1525902923, 12] -> [1525902930, 1]
 * Aa long as the sum of counts goes over the given threshold, it will
 * trigger the alert on event, vice versa.
 */ 
class AlertQueue extends events.EventEmitter {
    /**
     * Constructor of object
     * @param {*} threshold which triggers alert event
     * @param {*} span time to live of bucket
     */
    constructor(thresholdps, span, log) {
        super();
        this.log = log;
        this.threshold = thresholdps * span; // max total count within span
        this.ttl = span; // time to live
        this.alertOn = false; // alert status on or off
        this.bucketQueue = [];
        this.sum = 0; // sum of total counts currently in the queue
    }
    /**
     * Dump the status about the alert queue
     */
    print() {
        this.log.info(CATEGORY, "Alert queue status:");
        console.log("  ============ ALERT =============");
        console.log("  | Threshold is", this.threshold, "over", this.ttl, "seconds");
        console.log("  | Activated:", this.alertOn);
        console.log("  | Current Count:", this.sum);
        let len = this.bucketQueue.length;
        console.log("  | Queue Length:", len); // console.log("  | Queue:", this.bucketQueue);
        console.log("  | Earliest:",
                   len > 0 ? [new Date(this.bucketQueue[0][0] * 1000), this.bucketQueue[0][1]]: "null");
        console.log("  | Latest:",
                    len > 0 ? [new Date(this.bucketQueue[len-1][0] * 1000), this.bucketQueue[len-1][1]] : "null");
        console.log("  --------------------------------");
    }
    /**
     * Push the current time into the queue
     * Older buckets will get dropped accordingly
     * @param {*} now the Date object
     */
    push(now) {
        const log = this.log;
        let len = this.bucketQueue.length;
        let timestamp = now.getTime() / 1000;
        if (len > 0) {
            if (timestamp > this.bucketQueue[len - 1][0]) {
                this.bucketQueue.push([timestamp, 1]);
            } else if (timestamp === this.bucketQueue[len - 1][0]) {
                this.bucketQueue[len - 1][1] ++;
            } else {
                log.info(CATEGORY, "Ignored older timestamp", now);
                return;
            }
        } else {
            this.bucketQueue.push([timestamp, 1]);
        }
        this.sum ++;
        // drop expired buckets
        while (timestamp - this.bucketQueue[0][0] > this.ttl) {
            this.sum -= this.bucketQueue.shift()[1];
        }
        log.debug(CATEGORY, "Upon", now, ",", this.sum, "in the queue.");
        // emit alert events
        if (!this.alertOn && this.sum >= this.threshold) {
            this.alertOn = true;
            this.print();
            this.emit("alert_on", { triggeringTime: now, 
                                    triggeringHits: this.sum,
                                    triggeringRate: this.sum/this.ttl });
            return;
        }
        if (this.alertOn && this.sum < this.threshold) {
            this.alertOn = false;
            this.print();
            this.emit("alert_off", { triggeringTime: now,
                                     triggeringHits: this.sum,
                                     triggeringRate: this.sum/this.ttl });
        }
    }
}

exports.AlertQueue = AlertQueue;
})(); // close namepace