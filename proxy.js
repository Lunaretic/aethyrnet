var httpProxy = require('http-proxy');

console.log("Proxy Server Activated");

httpProxy.createServer({
  hostnameOnly : true,
  changeOrigin : true,
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
    'mafiaplus.net'           : '127.0.0.1:8002',
    'www.mafiaplus.net'       : '127.0.0.1:8002',
    'test.mafiaplus.net'      : '127.0.0.1:8082',
    
    //English
    'english.aethyrnet.com'   : '127.0.0.1:8003',
  }
}).listen(80);