var util = require ('./src/util.js');
var clc = require('cli-color');

util.log('==== ' + clc.cyan('Beginning Aethyrnet server startup') + ' ====');

//Packaged Libraries
var url = require('url');
var async = require('async');
var express = require('express');
var MongoStore = require('connect-mongo')(express);
var mongoose = require('mongoose');
var passport = require('passport');
var gzip = require('connect-gzip');

var conf = require('./src/conf.js');

if(process.env.NODE_ENV != 'production')
  process.env.NODE_ENV = 'development';

async.waterfall([
function(callback)
{
  //Connect to the database.
  //Wait for database connection before doing anything else.
  require('./src/database.js')(callback);
},
function(database, callback)
{
  //Run Passport config
  conf.configurePassport();
  conf.configureMail();

  //Set up middleware / static routing
  util.log("Setting up Express server and static file routing..");
  var server = express();

  function staticRouting(dirname, age)
  {
    return gzip.staticGzip(__dirname + dirname, {
      maxAge: age,
      gzPath: __dirname + '/gzip/' + dirname,
    });
  };

  //Cache images and JS libraries for up to a day.
  server.use('/public/images', staticRouting('/public/images', 1 * 24 * 60 * 60 * 1000));
  server.use('/public/js/lib', staticRouting('/public/js/lib', 1 * 24 * 60 * 60 * 1000));

  //On other stuff, no caching currently.
  server.use('/public', staticRouting('/public', 0));

  //Enable automatic body parsing on requests.
  server.use(express.bodyParser());
  
  //Session settings.
  server.use(express.cookieParser());
  server.use(express.session({
    secret : 'mirelezen',
    cookie : 
    {
      //One year expiration
      maxAge: 365 * 24 * 60 * 60 * 1000,
    },
    store : new MongoStore({
      mongoose_connection : database,
      collection : 'sessions',
      auto_reconnect : true,
    }),
  }));
  
  //Automatic GZipping.
  server.use(gzip.gzip());
  
  //Start up Passport
  server.use(passport.initialize());
  server.use(passport.session());

  
  
  
  //-------------------------------------------------------
  //                       Main API
  //-------------------------------------------------------
  
  //Set up server routing.
  require('./src/routes.js')(server);

  util.log("Setting up External Query Loop..");
  
  //Load the main query manager.
  var query_manager = require('./src/query_manager.js');
  query_manager.register(query_manager.query_user_avatars);
  query_manager.register(query_manager.query_ffxiv_blog);
  query_manager.register(query_manager.query_reddit);
  query_manager.start();


  return callback(null, server);
}],

//All startup proceedures done.
function(err, server)
{
  if(err)
  {
    //Shut down startup with error notification.
    util.log("Startup Errors: ")
    if(Array.isArray(err))
      for(var idx in err)
      {
        util.log(" ==== " + (idx+1) + " ==== ");
        util.log(err);
      }
    else
      util.log(err);
    return;
  }
  util.log("Binding server to port..");
  util.log('==== ' + clc.cyan('Aethyrnet server startup complete') + ' ====');
  
  server.configure('production', function()
  {
    util.log('---- MODE: ' + clc.redBright('production') + ' ----');
    server.listen(8000);
    
    util.sendMail("luna@aethyrnet.com", "Aethyrnet Online", "The Aethyrnet.com server started successfully. \n - " + new Date());
  });
  server.configure('development', function()
  {
    util.log('NODE_ENV: ' + clc.cyan('development'));
    server.listen(8080);
  });
  
});