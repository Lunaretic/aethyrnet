REPORTER = spec
LOGPATH = /root/ffxiv/log/
LOGFILE = $(LOGPATH)aethyrnet_`date +'%y-%m-%d_%H.%M'`.log
PROXYLOG = $(LOGPATH)proxy.log

prod:
	
	-NODE_ENV=production forever stop aethyrnet.js
	cd ../ffxiv/; NODE_ENV=production forever start -l $(LOGFILE) -a --minUptime 5000 --spinSleepTime 60000 aethyrnet.js

proxy:
	-NODE_ENV=production forever stop proxy.js
	cd ../ffxiv/; NODE_ENV=production forever start -l $(PROXYLOG) -a --minUptime 5000 --spinSleepTime 60000 proxy.js
	
commit:
	
	cd ../ffxiv-dev/; git commit; git push;
	cd ../ffxiv/; git pull;
	-NODE_ENV=production forever stop aethyrnet.js
	cd ../ffxiv/; NODE_ENV=production forever start -l $(LOGFILE) -a --minUptime 5000 --spinSleepTime 60000 aethyrnet.js
  
dev:
	cd ../ffxiv-dev/; NODE_ENV=development nodemon

test:
	cd ../ffxiv-dev/; NODE_ENV=test mocha --reporter $(REPORTER) --recursive

test-w:
	cd ../ffxiv-dev/; NODE_ENV=test mocha --reporter $(REPORTER) --recursive --watch --growl
  
.PHONY: test