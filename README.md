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

## Components
- LogObserver
- LogStat
  - Alert
- CommandlineParser
- Config
