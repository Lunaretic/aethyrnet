var httpProxy = require('http-proxy');

console.log("Proxy Server Activated");
/*
var proxyServer = httpProxy.createServer(function (req, res, proxy) {
  
  proxy.proxyRequest(req, res, {
    host: 'aethyrnet.com',
    port: 8000
  });
  
  proxy.proxyRequest(req, res, {
    host: 'scriblenews.com',
    port: 8080
  });
  
}).listen(80);*/


httpProxy.createServer({
  hostnameOnly: true,
  router: {
    
    //Aethyrnet
    'aethyrnet.com'           : '127.0.0.1:8000',
    'www.aethyrnet.com'       : '127.0.0.1:8000',
    'test.aethyrnet.com'      : '127.0.0.1:8080',
    
    //Scribl
    'scriblnews.com'          : '127.0.0.1:8001',
    'www.scriblnews.com'      : '127.0.0.1:8001',
    'test.scriblnews.com'     : '127.0.0.1:8081',
    
    //Mafia
    'mafiaplus.net'          : '127.0.0.1:8002',
    'www.mafiaplus.net'      : '127.0.0.1:8082',
    'test.mafiaplus.net'     : '127.0.0.1:8082',
  }
}).listen(80);