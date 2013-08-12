REPORTER = spec
PRODPATH = ~/ffxiv/
DEVPATH = ~/ffxiv-dev/
LOGFILE = aethyrnet_`date +'%y-%m-%d_%H.%M'`.log
PROXYLOG = $(PRODPATH)proxy.log

prod:
	-NODE_ENV=production forever stop aethyrnet.js
	cd $(PRODPATH); NODE_ENV=production forever start -l $(PRODPATH)/log/$(LOGFILE) -a --minUptime 5000 --spinSleepTime 60000 aethyrnet.js

save:
	cd $(DEVPATH); git add .; git commit -a;
	
commit:
	cd $(DEVPATH); git add .; git commit -a; npm version patch; git push;

commit-r:
	cd $(DEVPATH); git add .; git commit -a; npm version minor; git push;
	cd $(PRODPATH); git pull;
	-NODE_ENV=production forever stop aethyrnet.js
	cd $(PRODPATH); NODE_ENV=production forever start -l $(LOGFILE) -a --minUptime 5000 --spinSleepTime 60000 aethyrnet.js
  
dev:
	cd $(DEVPATH); NODE_ENV=development nodemon aethyrnet.js

test:
	cd $(DEVPATH); NODE_ENV=test mocha --reporter $(REPORTER) --recursive

test-w:
	cd $(DEVPATH); NODE_ENV=test mocha --reporter $(REPORTER) --recursive --watch --growl
  
.PHONY: test test-w dev commit commit-r prod save