var request = require('request');
var async = require('async');
var feedParser = require('feedparser');
var util = require('../util');
var cheerio = require('cheerio');
var url = require('url');

module.exports = {

  query : function query_dev_tracker(db, callback)
  {
    util.log("Querying Dev Tracker..");
    async.waterfall(
    [
      function(callback)
      {
        //Make web request
        util.webGet({
          hostname : 'forum.square-enix.com',
          path : '/ffxiv/search.php?do=process&search_type=1&contenttypeid=1&devtrack=1&starteronly=0&showposts=1&childforums=1&forumchoice[]=619',
          method : 'GET',
          //Spoof Firefox 19 User-Agent to avoid 302 Error.
          headers : {
            'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0',
          },
        }, function(err, data, res)
        {
          if(err != 302)
            return callback(err);
          callback(null, res.headers.location);
        });
      },
      
      function(location, callback)
      {
        var location = url.parse(location);
        //Make web request
        util.webGet({
          hostname : location.host,
          path : location.path,
          method : 'GET',
          //Spoof Firefox 19 User-Agent to avoid 302 Error.
          headers : {
            'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0',
          },
        }, function(err, data)
        {
        
          //Parse the DOM
          var $ = cheerio.load(data);
          
          //Navigate the tree to the right element and test for correctness.
          var $posts = $('#searchbits .postbitcontainer');
          
          if($posts.length == 0)
            return callback("Search page results format was not as expected.");
          
          // Calculate today's date in SE's nutty UTC+1000 offset.
          var today = new Date();
          today.setHours(today.getHours()+14);
          today = ('0' + (today.getMonth()+1)).slice(-2) + "-" + ('0' + (today.getDate())).slice(-2) + "-" + today.getFullYear()
          
          // For each Dev Tracker post.
          $posts.each(function(index, post)
          {
            //Cache selector
            var $post = $(post);
            
            //Read out the date and time from the DOM.
            var time = $post.find('.time').text().trim();
            var dt = $post.find('.date');
            dt.children().remove();
            dt = dt.text().trim().toLowerCase();
            
            //Check for 'Yesterday' in order to do a -1 day on it later.
            var yesterday = (dt == "yesterday");
            
            //Convert to same date format as SE's other dates.
            if(dt == "today" || dt == "yesterday")
              dt = today;
            
            //Convert date to ISO format, and then into a JS object. Trying to get a nice RFC2822 string here.
            dt = new Date(dt.slice(6) + '-' + dt.slice(0,2) + '-' + dt.slice(3,5));
            
            //Slices off the time end to just retreive the RFC 2822 date without time.
            dt = dt.toString().split(':')[0].slice(0,-2);
            
            //Now we parse our time string.
            var time = time.split(' ');
            var hours = parseInt(time[0].substr(0,2));
            var minutes = parseInt(time[0].substr(3,2));
            
            //Don't forget to forward those PM times~
            if(time[1] == 'pm')
              hours = hours + 12;
            
            //Concatenate the RFC 2822 starter with the new time format and SE's goofy timezone offset.
            dt = dt + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':00 +1000';
            dt = new Date(dt);
            
            //Account for yesterday flag.
            if(yesterday)
              dt.setDate(dt.getDate() -1);
            
            //Convert to UTC timezone for our database.
            dt = new Date(dt.getTime());
            
            // Format it and build it into our main feeds list.
            var temp = new (db.model('feedEntry'))({
              title : $post.find('.posttitle').text().trim(),
              source : 'The FFXIV Dev Tracker',
              link : 'http://forum.square-enix.com/ffxiv/' + $post.find('.posttitle a').attr('href'),
              date : dt, 
              image : 'dev_tracker.png',
              imageLink : 'http://forum.square-enix.com/ffxiv/' + $post.find('.posttitle a').attr('href'),
              content : $post.find('.postcontent').text(),
              author : $post.find('.username_container a').last().text(),
            });
                        
            //Old entries will fail on insert.
            //Not the most elegant way of doing things, but it'll do for now.
            temp.save();
          });
          
          return callback(err);
        });
        
      },
    ],
    function(err, result)
    {
      if(err)
        util.err(err);
        
      util.log("Dev Tracker query done.");
      return callback();
    });
  },
}