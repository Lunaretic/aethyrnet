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
  
  //Basic LCS feed.
  server.get('/api/lcs', function(req, res){
	database.model('lcs_player').find().sort({ rank : 'asc' }).exec(function(err, docs)
	{
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		
		var data = [];
		if(err)
			util.log(err);
		else if((!docs) || docs.length == 0)
			util.log("No LCS player entries found.");
		else
			data = docs;
		
		res.end(JSON.stringify(data));
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
			data = docs;
		res.end(JSON.stringify(data));
	});
  });
  
  //Basic hunts info.
  server.get('/api/hunts', function(req, res){

	//Prevent non-admin access to other users.
	if(!req.user || req.user.adminLevel < 2)
	  return util.clientErr(res, "You must be an admin to access the hunt tracker.");

	database.model('hunt_zone').find().sort("-name").exec(function(err, docs)
	{
	  var data = [];
	  if(err)
		util.log(err);
	  else if((!docs) || docs.length == 0)
		util.warn("No hunt zones found.");
	  else
	  {
		data = docs;
	  }

	  res.end(JSON.stringify(data));
	});
  });
	
  server.post('/api/hunt_update', function(req, res){
	database.model('hunt_zone').findOne({ name : req.body.zone }).exec(function(err, zone)
	{
		//Prevent non-admin access to other users.
		if(!req.user || req.user.adminLevel < 2)
			return util.clientErr(res, "You must be an admin to access the hunt tracker.");
		

		//Make sure it's a valid zone and hunt class.
		if(!zone)
			return res.end();
		if(!zone[req.body.huntClass])
			return res.end();
		
		var tod = new Date();
		if(req.body.tod && typeof(req.body.tod) == 'string')
		{
			tod = new Date(req.body.tod);
		}
		
		//Create a fresh object (otherwise mongoose won't see the update).
		zone[req.body.huntClass] = {
			name : zone[req.body.huntClass].name,
			tod : tod,
			reporter : req.user.username
		};

		zone.save(function(err){
			return res.end(JSON.stringify({ success: true }));
		});
	});
  });
  
  server.get(/\/api\/profile\/?(.*)/, function(req,res){

	//Assign ID if we don't have one.
	if(!req.body._id && req.params.length > 0)
	  req.body._id = req.params[0];

	//Get our own data.
	if((!req.body._id) || req.body._id === req.user._id)
	  return res.end(getUserInfo(req.user));

	//Prevent non-admin access to other users.
	else if(req.user.adminLevel < 3)
	  util.clientErr(res, "Not allowed to access other users profile data.");

	//Return document.
	else
	  return database.model('user').findById(req.body._id, function(err, doc){
		if(err || !doc)
		  return util.clientErr(res, err || "User not found.");
		return res.end(getUserInfo(doc));
	  });
  });
  
  server.patch(/\/api\/profile\/?(.*)/, function(req, res){
	if(!req.user)
	  return util.clientErr(res, "Not Logged In.");

	//Assign ID if we don't have one.
	if((!req.body._id) || req.body._id === req.user._id)
	  req.body._id = req.params[0];

	//Non-admins aren't allowed up edit other users.
	if((req.body._id && req.user._id != req.body._id)
		&& req.user.adminLevel < 3)
	  util.err('You do not have rights to update other users.');

	//Non-admins aren't allowed to update usernames.
	if(('username' in req.body) && req.user.adminLevel < 3)
	  util.err('You cannot change your username.');


	function mergeSave(usr)
	{
	  for(var idx in req.body)
		usr[idx] = req.body[idx];

	  usr.save(function(err) {
		if(err)
		  return util.clientErr(res, err.errors);
		return util.clientOk(res);
	  });
	};

	//If we're updating ourselves, no need to query DB.
	if(req.body._id === req.user._id || !req.body._id)
	  return mergeSave(req.user);
	else
	  //Otherwise, gotta get the mongoDB document.
	  return database.model('user').findById(req.body._id, function(err, doc){
		if(err || !doc)
		  return util.clientErr(res, err || "User not found.");
		return mergeSave(doc);
	  });


  }); 
 

  //==========================================
  //              Authentication
  //==========================================
  
  //Cookie User-Info retrieval
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

	database.model('user').find({}, 'username _id').sort('+username').exec(function(err, docs)
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