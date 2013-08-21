var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var database = (require('./database.js'))();
var util = require('./util.js');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');

//Import the base package.json for data resding.
var aethyrPackage = require('../package.json');

//Get a JSON client-safe representation of a user.
function getUserInfo(user, objectify)
{
  if(!user)
    var uData = new (database.model('user'))().toObject();
  else
    var uData = user.toObject();
    
  if(objectify)
    return uData;
  else
    return JSON.stringify(uData);
};


module.exports = function(server)
{

  //Store the main frame in RAM.
  util.log("Caching main index frame.");
  var indexTemplate = _.template(fs.readFileSync(__dirname + '/index.html', 'utf8'));

  //Set up routing for the main frame.
  util.log("Setting up main index routing.");
  var indexFile = path.join(__dirname,'/index.html');
  var indexMTime = fs.statSync(indexFile).mtime;
  var template = _.template(fs.readFileSync(__dirname + '/index.html').toString());
  
  //All non public/api calls.
  server.get(/^(\/(?!(api|public|favicon))).*$/, function(req, res)
  {
    //Check index file's Mtime.
    fs.stat(indexFile, function(err, stat){
      if(err)
        throw err;
      
      var userData = getUserInfo(req.user, true);
      var options = {
        environment : util.prettyName(process.env.NODE_ENV),
        userData : userData,
        niceName : util.prettyName(userData.username),
        bgImage : ( req.user ? req.user.bgImage : false ),
        version : aethyrPackage.version,
      };
        
      //New version? Gotta update cache.
      if(stat.mtime.toString() != indexMTime.toString())
      {
        util.log("Updating Cache for Index.");
        return fs.readFile(indexFile, function(err, data){
          if(err)
            throw err;
          indexMTime = stat.mtime;
          template = _.template(data.toString());
          res.end(template(options));
        });
      }
      
      //Old version?  Throw the cache at the request.
      return res.end(template(options));
    });
  });
  


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
  
  server.patch('/api/profile', function(req, res){
    if(!req.user)
      return util.clientErr(res, "Not Logged In.");
    
    //Username failure
    if(req.body.username && req.user.username != req.body.username)
      util.err('Username mismatch.');
    
    if(req.user.charUrl != req.body.charUrl)
      req.user.avatar = '_default.jpg';
    
    //Todo: Make generalized merge function
    if(req.body.bgImage)
      req.user.bgImage = req.body.bgImage;
    if(req.body.email)
      req.user.email = req.body.email;
    if(req.body.charUrl)
      req.user.charUrl = req.body.charUrl;
    if(req.body.charName)
      req.user.charName = req.body.charName;
    if(req.body.sidebarOrientation)
      req.user.sidebarOrientation = req.body.sidebarOrientation;
    if(req.body.sidebarSticky)
      req.user.sidebarSticky = (req.body.sidebarSticky ? true : false);
    
    req.user.save(function(err) {
      if(err)
        return util.clientErr(res, err.errors);
      return util.clientOk(res);
    });
    
  }); 
 

  //==========================================
  //              Authentication
  //==========================================
  
  //Cookie User-Info retreival
  server.get('/api/login', function(req, res)
  {
    return res.end(getUserInfo(req.user));
  });
  
  //Log out
  server.get('/api/logout', function(req, res)
  {
    req.logout();
    return res.end();
  });
  
  //Username/Password Login
  server.post('/api/login', passport.authenticate('local'), function(req, res) 
  {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.end(getUserInfo(req.user));
  });
  
  //User Registration
  server.post('/api/register', function(req, res)
  {
    //Validate inputs
    if(!validateInput(req.body, {
      username : 'string',
      password : 'string',
    }, true))
      return util.clientErr(res, 'Bad Input.');
      
    req.body.username = util.makeSlug(req.body.username);
    req.body.password = req.body.password.trim();
    
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
  
  
  server.get('/api/users', function(req, res)
  {
    if(!req.user || req.user.adminLevel < 3)
      return util.clientErr(res, "You do not have permission to access this resource");
      
    database.model('user').find({}, 'username email charUrl adminLevel').sort('+username').exec(function(err, docs)
    {
      var data = [];
      if(err)
        util.log(err);
      else if((!docs) || docs.length == 0)
        util.warn("No users found in user table?");
      else
      {
        data = docs;
      }
      
      res.end(JSON.stringify(data));
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