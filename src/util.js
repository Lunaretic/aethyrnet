var http = require('http');
var clc = require('cli-color');

//Hijack the main error out to email in production.
if(process.env.NODE_ENV == 'production')
{
  process.on('uncaughtException', function(err)
  {
    if(module.exports.error)
      module.exports.error("Unhandled exception intercepted, sending error email and shutting down.");
    if(module.exports.sendMail)
      module.exports.sendMail('luna@aethyrnet.com', "Aethyrnet Error", err + '\n' + new Date(), function(emailErr, message)
      {
        //Remove the listener, *then* throw.
        process.removeAllListeners('uncaughtException');
        throw(err);
      });
    else
    {
      //Remove the listener, *then* throw.
      process.removeAllListeners('uncaughtException');
      throw(err);
    }
  });
}

module.exports.log = function log(msg)
{
  var dt = new Date()
  console.log("[ " + dt.getHours() + ":" + padLeft(dt.getMinutes(), '00') + ":" + padLeft(dt.getSeconds(), '00') + " ] [ " + clc.white('LOG') + " ] " + msg.toString());
};

module.exports.warn = function logWarning(msg)
{
  var dt = new Date()
  console.log("[ " + dt.getHours() + ":" + padLeft(dt.getMinutes(), '00') + ":" + padLeft(dt.getSeconds(), '00') + " ] [ "+ clc.yellow('WARN') +" ] " + msg.toString());
}

module.exports.notify = function logNotify(msg)
{
  var dt = new Date()
  console.log("[ " + dt.getHours() + ":" + padLeft(dt.getMinutes(), '00') + ":" + padLeft(dt.getSeconds(), '00') + " ] [ "+ clc.cyan('NOTIFY') +" ] " + msg.toString());
}

module.exports.error = module.exports.err = function logError(msg, kill)
{
  var dt = new Date()
  console.log("[ " + dt.getHours() + ":" + padLeft(dt.getMinutes(), '00') + ":" + padLeft(dt.getSeconds(), '00') + " ] [ "+ clc.redBright('ERROR') +" ] " + msg.toString());
  if(kill)
  {
    console.log("[ " + dt.getHours() + ":" + padLeft(dt.getMinutes(), '00') + ":" + padLeft(dt.getSeconds(), '00') + " ] [ "+ clc.redBright('ERROR') +" ] Aethyrnet Shutting Down at Error Request.");
    process.exit(1);
  }
}




module.exports.makeSlug = function(data)
{
	//Strip bad characters.
  str = data || "";
  if(typeof(str) != "string")
    str = str.toString
	str = str.toLowerCase();
	str = str.replace(' ','_');
	str = str.replace(/[^a-z0-9_]+/g,'');
	return str;
};

module.exports.makePretty = function(str)
{
  str = str.replace('_', ' ');
  str[0] = str[0].toUpperCase();
};


module.exports.clientOk = function(res, message)
{
  
  res.setHeader('Content-Type', 'text/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    response : "OK",
    err : message,
  }));
};


module.exports.clientErr = function(res, message)
{
  res.setHeader('Content-Type', 'text/json');
  res.statusCode = 400;
  res.end(JSON.stringify({
    response : "Error",
    err : message,
  }));
};

module.exports.truncate = function(str, length)
{
  
  if(typeof(str) == 'object')
    throw new TypeError();
  
  if(!length || length <= 0)
    return str.toString();
  
  if(length < 3)
    length = 3;
    
  if(typeof(str) != 'string')
    str = str.toString();
  
  if(str.length <= length)
    return str;
  
  str = str.substr(0, length-3);
  
  var lastSpace = str.lastIndexOf(' ');
  if(lastSpace != -1)
    str = str.substring(0, lastSpace);
  
  return  str + '...';
}

//Accessor for hooking in from conf.js for security.
module.exports.bindMailServer = function(mailServer)
{
  module.exports.mailServer = mailServer;
  delete module.exports.bindMailServer;
}

module.exports.sendMail = function sendMail(address, subject, text, callback)
{
  //Send all the Emails!
  module.exports.mailServer.send({
     subject: subject,
     text:    text,
     from:    "Luna <luna@aethyrnet.com>", 
     to:      address,
  }, function(err, message) 
  {
    module.exports.notify("Email sent to: "  + address);
    
    if(err)
      module.exports.err("SendMail Failure: " + err); 
    
    if(callback)
      callback(err, message);
  });
}

module.exports.webGet = function(options, callback)
{
  if(!options.method)
    options.method = 'GET';
  
  var data = '';
  return http.request(options, function(res)
  {
    if(res.statusCode != 200)
      return callback(options.hostname + " responded with status code: " + res.statusCode + " - [ " + options.path + " ]");
  
    //Save incoming data.
    res.on('data', function(chunk)
    {
      data += chunk;
    });
    
    //Parse finalize data.
    res.on('end', function(){
      if(options.type == 'json')
      {
        try
        {
          if(data)
            data = JSON.parse(data);
          else
            return callback('No data returned from server.', data);
        }
        catch (e) 
        {
          return callback('Bad JSON data returned from server.', data);
        }
      }
        
      return callback(null, data);
    });
    
  }).on('error', function(err){
    return callback(err, data);
  }).end();
}

module.exports.prettyName = function(username)
{
  if(!username || typeof(username) != 'string')
    return '';
  
  //Capitalize first letter
  return (username.charAt(0).toUpperCase() + username.slice(1)).replace("_", " ");
}

var padLeft = function (str, paddingValue) {
   return String(paddingValue + str).slice(-paddingValue.length);
};