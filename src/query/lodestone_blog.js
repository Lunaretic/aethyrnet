var request = require('request');
var async = require('async');
var feedParser = require('feedparser');
var util = require('../util');

module.exports = {

  query : function query_ffxiv_blog(db, callback)
  {
    async.waterfall(
    [
      function(callback)
      {
        util.log("Updating data from FFXIV Blog..");
        //Base XML data.
        var data = [];
        
        //Query the RSS feed and shoot it into the feedParser library.
        request('http://rss.finalfantasyxiv.com/na/blog_feed.xml').pipe(new feedParser({
            addmeta : false,
            normalize : false,
          }))
          .on('error', function(error) {
            //Pop errors to the top.
            return callback(err);
          })
          .on('readable', function () {
            // Snag the entry.
            var entry = this.read();
            
            // Format it and build it into our main feeds list.
            var temp = new (db.model('feedEntry'))({
              title : entry['rss:title']['#'],
              source : 'The FFXIV Official Blog',
              link : entry['rss:link']['#'],
              date : new Date(entry['rss:pubdate']['#']),
            });
            
            
            //Old entries will fail on insert.
            //Not the most elegant way of doing things, but it'll do for now.
            temp.save();
          })
          .on('end', function() {
            util.log("FFXIV Blog Update Done.");
            return callback(null, data);
          });
      },
    ],
    function(err, result)
    {
      if(err)
        util.log(err);
      return callback();
    });
  },
}