(() => { // namespace
'use strict';
const events = require('events');
const fs = require('fs');

const CATEGORY = "@LogObserver";

class LogObserver extends events.EventEmitter {
    /**
     * Constructor of log observer class
     * @param {String} filename with full path
     * @param {Object} options 
     * @param {Object} logStats LogStats object to collect stats
     */
    constructor(filename, options) {
        super(filename, options);
        console.log("[INFO]", CATEGORY, "Initializing LogObserver ..."); 
        let defaultOptions = {
            verbose: false,
            delimiter: '\n',
        };
        // merge defaultOption into customized options 
        this.options = {...options, ...defaultOptions};
        if (filename === undefined) {
            this.filename = "/var/log/access.log";
        } else {
            this.filename = filename;
        }
        // Check read access to the file, if not it will throw
        try {
            fs.accessSync(this.filename, fs.constants.R_OK);
        }
        catch (err) {
            throw err.message;
        }
    }
    /**
     * Start watching file which will emit events for content change
     */
    startWatch() {
        // tail -f the file with callback on the change
        fs.watchFile(this.filename, (curr, prev) => {
            console.log("[DEBUG]", CATEGORY, "File changed from", prev.size, curr.size);
            if (curr.size <= prev.size) {
                console.log("[DEBUG]", CATEGORY, "Ignoring no change.");
                return;
            }
            let fstream = fs.createReadStream(
                this.filename,
                {start: prev.size, end: curr.size - 1});
            fstream.on('error', (error) => {
                console.log("[DEBUG]", CATEGORY, "fs.ReadStream error event:", error);
                this.emit('error', error);
            });
            fstream.on('end', () => {
                console.log("[DEBUG]", CATEGORY, "fs.ReadStream end event:");
            });
            fstream.on('data', (data) => {
                console.log("[DEBUG]", CATEGORY, "fs.ReadStream data event:");
                // re-emit data chunk to multiple lines
                ('' + data).split(this.options.delimiter).forEach(line => {
                    if (line.length > 1) {
                        this.emit('line', line);
                    }
                }, this);;
            });
        });
    };
} // class LogObserver

exports.LogObserver = LogObserver;
})(); // close namepace