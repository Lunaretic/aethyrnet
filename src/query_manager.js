var fs = require('fs');
var async = require('async');
var http = require('http');
var db = require('./database')();
var util = require('./util');



//Starts main loop to query other websites for feed data.
var query_all = function()
{
  //Run all web queries in parallel.
  async.parallel(
  
    module.exports.queries,
  function(err, result)
  {
    //Re-query in 15 minutes.
    setTimeout(query_all, 15 * 60 * 1000);
  });
};

module.exports = {
  queries : {
    
  },

  register : function(query)
  {
    util.log("Registering Query: " + query.name);
    module.exports.queries[query.name] = query.bind(this, db);
  },
  
  remove : function(query)
  {
    var idx = '';
    if(typeof(query) = 'string')
      idx = query;
    else
      idx = query.name;
    
    util.log("Removing Query: " + idx);
    delete queries[idx];
  },

  start : function()
  {
    query_all();
  }
};

//TODO: Patch this into a file reader later.
module.exports.query_lodestone = require('./query/lodestone.js').query;
module.exports.query_user_avatars = require('./query/user_avatars.js').query;
module.exports.query_ffxiv_blog = require('./query/lodestone_blog.js').query;
module.exports.query_reddit = require('./query/reddit.js').query;
module.exports.query_dev_tracker = require('./query/dev_tracker.js').query;



ArrayContains = function(self, k, callback) {
    return (function check(i) {
        if (i >= self.length) {
            return callback(false);
        }

        if (self[i] === k) {
            return callback(true);
        }

        return process.nextTick(check.bind(null, i+1));
    }(0));
};