var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var database = (require('./database.js'))();
var util = require('./util.js');
var _ = require('underscore');
var fs = require('fs');

module.exports = function(server)
{
  //Basic news feed.
  server.get('/api/feed', function(req, res){
    database.model('feedEntry').find().sort('-date').limit(10).exec(function(err, docs)
    {
      var data = [];
      if(err)
        util.log(err);
      else if((!docs) || docs.length == 0)
        util.log("No feed entries found.");
      else
      {
        data = docs;
      }
      
      res.end(JSON.stringify(data));
    });
  });
  
  server.get('/api/profile', function(req,res){
    return res.end(getUserInfo(req.user));
  });
  
  server.put('/api/profile', function(req, res){
    
    if(!req.user)
      return util.clientErr(res, "Not Logged In.");
    
    //Username failure
    if(req.user.username != req.body.username)      
      return util.clientErr(res, "Username Mismatch.");
    
    if(req.user.charUrl != req.body.charUrl)
      req.user.avatar = '_default.jpg';
    
    //Todo: Make generalized merge function
    req.user.bgImage = req.body.bgImage;
    req.user.email = req.body.email;
    req.user.charUrl = req.body.charUrl;
    
    req.user.save(function(err) {
      if(err)
        return util.clientErr(res, err.errors);
      return util.clientOk(res);
    });
    
  }); 
 

  //Store the main frame in RAM.
  util.log("Caching main index frame.");
  var indexTemplate = _.template(fs.readFileSync(__dirname + '/index.html', 'utf8'));

  //Set up routing for the main frame.
  util.log("Setting up main index routing.");
  server.get('/', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=' + 1 * 24 * 60 * 60 * 1000);
    res.end(indexTemplate({
      environment : process.env.NODE_ENV,
      userData : getUserInfo(req.user),
      bgImage : ( req.user ? req.user.bgImage : false ),
    }));
  });

  //Main frame reloading.
  server.get('/clearCache', function(req, res){
    res.send("Reloading main index..");
    indexTemplate = _.template(fs.readFileSync(__dirname + '/index.html', 'utf8'));
    res.end("Reload complete.");
  });
  
  
  //==========================================
  //              Authentication
  //==========================================
  
  //Get a JSON client-safe representation of a user.
  function getUserInfo(user)
  {
    if(!user)
      return JSON.stringify({
        username : "anonymous",
      });
      
    else
      return JSON.stringify({
        username : user.username,
        bgImage : user.bgImage,
        email : user.email,
        charUrl : user.charUrl,
        avatar : user.avatar,
      });
  };
  
  //Cookie User-Info retreival
  server.get('/login', function(req, res)
  {
    return res.end(getUserInfo(req.user));
  });
  
  //Log out
  server.get('/logout', function(req, res)
  {
    req.logout();
    return res.end();
  });
  
  //Username/Password Login
  server.post('/login', passport.authenticate('local'), function(req, res) 
  {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.end(getUserInfo(req.user));
  });
  
  //User Registration
  server.post('/register', function(req, res)
  {
    //Validate inputs
    if(!validateInput(req.body, {
      username : 'string',
      password : 'string',
    }, true))
      return util.clientErr(res, 'Bad Input.');
    
    //Test password requirements
    if(req.body.password.length < 7)
      return util.clientErr(res, "Invalid Password - Must be at least 7 characters long.");
    
    
    //Hash password
    bcrypt.hash(req.body.password, null, null, function(err, hash) {
    
      //Attempt to save new user
      var mdl = new (database.model('user'))({ username : req.body.username, password : hash });
      mdl.save(function(err)
      {
        if(!err)
        {
          return res.end(getUserInfo(mdl));
        }
        
        if(err.code == 11000)
          return util.clientErr(res, "Username already in use.");
        else if(err.name == "ValidationError")
          return util.clientErr(res, err.errors[Object.keys(err.errors)[0]].type);
        else
        {
          util.log(err);
          return util.clientErr(res, "Unknown Error. : (");
        }
        
      });
      
    });
  });
  
  
  var validateInput = function(actual, expected, noFalse)
  {
    for(var idx in expected)
    {
      if(actual[idx] === undefined || actual[idx] === null)
        return false;
      if(typeof(actual[idx]) != expected[idx])
        return false;
      if(noFalse && !actual[idx])
        return false;
    }
    return true;
  }
}