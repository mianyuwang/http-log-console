# http-log-console
A HTTP log monitoring console

## Design Spec
- Create a simple console program that monitors HTTP traffic on your machine:
- Consume an actively written-to w3c-formatted HTTP access log (https://en.wikipedia.org/wiki/Common_Log_Format). It should default to reading /var/log/access.log and be overrideable.
- Display stats every 10s about the traffic during those 10s: the sections of the web site with the most hits, as well as interesting summary statistics on the traffic as a whole. A section is defined as being what's before the second '/' in a URL. For example, the section for "http://my.site.com/pages/create" is "http://my.site.com/pages".
  - How many sections will be enough and what statistics you find interesting?
- Make sure a user can keep the console app running and monitor traffic on their machine.
- Whenever total traffic for the past 2 minutes exceeds a certain number on average, add a message saying that “High traffic generated an alert - hits = {value}, triggered at {time}”. The default threshold should be 10 requests per second, and should be overrideable.
- Whenever the total traffic drops again below that value on average for the past 2 minutes, add another message detailing when the alert recovered.
  - The alert should only "trigger" once and only re-trigger if it resolves first.
- Make sure all messages showing when alerting thresholds are crossed remain visible on the page for historical reasons.
- Write a test for the alerting logic.

## Module Design
### Console (console.js)
This is the main entry point by calling npm module(https://www.npmjs.com/package/commander) to parse the command line arguments as below
```
$ node console.js --help

  Usage: console [options] <file>

  Options:

    -V, --version        output the version number
    -v, --verbose        Print verbose logs
    -i, --interval [n]   Stats spew interval in seconds, default to 10 seconds (default: 10)
    -t, --threshold [n]  High traffic alert threshold, default to 10 per second (default: 10)
    -s, --span [n]       High traffic alert span, default to 120 seconds (default: 120)
    -h, --help           output usage information
```
The console program itself logs everything using npm module (https://www.npmjs.com/package/basic-logger) except printing stat periodically and when alert is triggered.

Console instantiate one LogObserver and one LogStats object, see below for more details about these two classes.

### LogObserver
LogObserver watches the file user provided in command line or the default /var/log/access.log and emit new `line` events.

Console module binds this event and calls LogStat to ingest the line.

### LogStats
LogStats parses each line coming from the LogObserver and update the stats variables of which there is an AlertQueue which will trigger or recover alerts.

LogStats also sets up an recurring event to print out the stats information like
```
  ============== STATS ==============
  | Total Hits = 587
  | Total Bytes = 806711
  | Last Log Received Time = 2018-05-12T20:38:05.000Z
  | In the last 10 seconds:
  |   Most Hit Section = '/newyork', Hits = 20
  |   Most Returned Status = 200, Hits = 16
  -----------------------------------
```

### AlertQueue
AlertQueue maintains an internal queue where each item in the queue is a bucket of timestamp in second and the log count on this timestamp. Depending on the span (default to 120 seconds) provided, older items get remove, new item get added. When the total count goes above or below the threshold, it emits alert_on or alert_off events. With 30 seconds span and a rate of 10 per second, the console prints as follow,
```
[2018-05-12 16:37:35.953] (info) @AlertQueue Alert queue status:
  ============ ALERT =============
  | Threshold is 300 over 30 seconds
  | Activated: true
  | Current Count: 300
  | Queue Length: 21
  | Earliest: [ 2018-05-12T20:37:12.000Z, 11 ]
  | Latest: [ 2018-05-12T20:37:32.000Z, 15 ]
  --------------------------------
[2018-05-12 16:37:35.955] (warning) @LogStats # High traffic generated an alert - hits = 300, rate = 10 per second, triggered at 2018-05-12T20:37:32.000Z
```

## Usage
Start the console program by default
```
node console.js
```
or 
```
# monitor a test log file in test/access.log, set alert if 5 per second coming in the past 30 seconds span, print stat every 15 seconds
node console.js -t 5 -s 30 -i 15 test/access.log
```
### Test client
There is a test client can write random logs into designated file in a given rate to simulate. Use another terminal and run
```
node test/loggen.js -r 10 test/access.log
```
adjust the -r parameter to test alert on and off behaviors.
