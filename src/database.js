var util = require('./util.js');
var fs = require('fs');
var mongoose = require('mongoose');


var moduleCallback = false;

//Open MDB connection
var path = 'mongodb://127.0.0.1/ffxiv';
if(process.env.NODE_ENV != 'production')
  path = 'mongodb://127.0.0.1/ffxiv-dev';

util.log('Opening connection to database at ' + path + '..');

var database = mongoose.createConnection(path, function(err)
{
  if(err)
    return err;
  
  var errs = [];
  
  //Build list of model directories to search.
  var directories = [];//Object.keys(global.plugins);
  //for(idx in directories)
  //  directories[idx] = '/plugins/'+directories[idx]+'/models/';
  directories.push(process.cwd() + '/models/');

  for(var dIdx in directories)
  {
    try
    {
      var stats = fs.lstatSync(directories[dIdx]);
      if(!stats.isDirectory())
        throw new Exception();
    }
    catch(e)
    {
      //Invalid directory, skip itteration.
      continue;
    }
    
    //Read files in directory
    var files = fs.readdirSync(directories[dIdx]);
    for(var idx in files)
    {
      try
      {
        //If it's a .js file
        var fName = files[idx];
        if(fName.slice(-3,fName.length) == '.js')
        {
          util.log('Importing database model file: ' + directories[dIdx]+ '/' + fName);
          
          //Get our file.
          var req = require(directories[dIdx]+fName);
          
          for(var idx in req)
          {
            util.log(' - ' + idx);
            database.model(idx, req[idx]);
          }
        }
      }
      catch(e)
      {
        errs.push(e);
        util.log('Error loading database model file: ' + directories[dIdx]+fName);
      }
    }
  } 
  
  //Return the full instance.
  if(moduleCallback)
    return moduleCallback(( errs.length > 0 ? errs : null), database);
});

//Export established database object
module.exports = function(callback) {
  if(callback)
    moduleCallback = callback;
  
  return database;
};