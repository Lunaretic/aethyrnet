REPORTER = spec
LOGPATH = /root/ffxiv/log/
LOGFILE = $(LOGPATH)aethyrnet_`date +'%y-%m-%d_%H.%M'`.log
PROXYLOG = $(LOGPATH)proxy.log

prod:
	-@NODE_ENV=production forever stop aethyrnet.js
	@NODE_ENV=production forever start -l $(LOGFILE) -a --minUptime 5000 --spinSleepTime 60000 aethyrnet.js

proxy:
	-@NODE_ENV=production forever stop proxy.js
	@NODE_ENV=production forever start -l $(PROXYLOG) -a --minUptime 5000 --spinSleepTime 60000 proxy.js
  
dev:
	@NODE_ENV=development nodemon

test:
	@NODE_ENV=test mocha --reporter $(REPORTER) --recursive

test-w:
	@NODE_ENV=test mocha --reporter $(REPORTER) --recursive --watch --growl
  
.PHONY: test