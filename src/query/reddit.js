if (global.GENTLY) require = GENTLY.hijack(require);

var http = require('http');
var async = require('async');
var util = require('../util.js');

module.exports = {
  contactReddit : function(callback)
  {
    util.webGet({
      hostname : 'www.reddit.com',
      path : '/r/ffxiv.json?limit=3',
      headers : {
        'User-Agent' : 'aethyrnet query manager bot by /u/crabcommander',
      },
      type : 'json',
    }, function(err, data, res)
    {
      return callback(err, data);
    });
  },
  
  query : function query_reddit(db, callback){    
    async.waterfall([
      module.exports.contactReddit,
      //At this point we have fresh/valid reddit data.
      function(data, callback)
      {
        for(idx in data.data.children)
        {
          var topic = data.data.children[idx].data;
          
          //Old entries will fail on insert.
          //Not the most elegant way of doing things, but it'll do for now.
          var mdl = new (db.model('feedEntry'))({
            title : topic.title,
            source : ( topic.is_self ? '/r/ffxiv' : /(?:[^:]*:\/\/)?(?:www\.)?([^\/]+\.[^\/]+)/.exec(topic.url)[1] ),
            link : ( topic.is_self ? 'http://www.reddit.com' + topic.permalink : topic.url ),
            author : topic.author,
            date : new Date(topic.created_utc * 1000),
            image : ( topic.is_self ? 'reddit.png' : 'reddit_link.png' ),
            imageLink : ( topic.is_self ? 'http://www.reddit.com' + topic.permalink : topic.url ),
            content : ( topic.is_self ? util.truncate(topic.selftext, 100) : '<a href="' + 'http://www.reddit.com' + topic.permalink + '">View the comments on /r/ffxiv</a>' ),
          }).save();
        }
        return callback();
      }
    
    ], function(err, results)
    {
      if(err)
        util.log(err);
    
      //Final CB
      return callback();
    });
  },
}