var async = require('async');
var util = require('../util');

//Data we need to retreive, and functions to recover it from the DOM.
var characterFields = {
  'name' : function($)
  {
    return '';
  },
  'race' : function($)
  {
    return '';
  },
  'clan' : function($)
  {
    return '';
  },
  'fc' : function($)
  {
    return '';
  },
  'server' : function($)
  {
    return '';
  },
  'gc' : function($)
  {
    return '';
  },
  'primaryJobLevel' : function($)
  {
    return 0;
  },
  'secondaryJobLevel' : function($)
  {
    return 0;
  },
  'avatar' : function($)
  {
    return '';
  },
};
  
module.exports = {

  parseUserData : function parseUserData(user, data, callback)
  {
    callback();
  },
  
  query : function query_lodestone(db, callback)
  {
    async.waterfall(
    [
      //First, query mongoose for all of our user's Lodestone URL's.
      function(callback)
      {
        //Find all of our users who have Lodestone URLs but no avatar yet.
        db.model('user').find()
        .select('username charUrl')
        .where('charUrl').gt('')
          // Use ne(false) rather than equals(true) to support old user entries.
        .where('charValidated').ne(false) 
        .exec(function(err, docs)
        {
          //return callback(err, [0, 1, 2]);
          return callback(err, docs);
        });
      },
      function(users, callback)
      {
        //Omitted until the lodestone is up and functional.
        return callback();
        
        //Query each user page in sequence; 
        async.each(users, function(user, callback)
        {
          util.warn("User: " + user.username);
          //Break down the user's character URL.
          var charUrl = /(?:[^:]*:\/\/)?(?:www\.)?([^\/]+\.[^\/]+)(.*)/.exec(user.charUrl);
        
          //Feed the URL into node's connect's http request.
          util.webGet(
          {
            //Spoof Firefox 19 User-Agent to avoid 302 Error.
            hostname : charUrl[1],
            path : charUrl[2],
            headers : {
              'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0',
            }
          },
          function(err, data){
            //Log the error, but don't halt on it or it will kill all of the async.each instances.
            if(err)
            {
              util.warn('Failed to retrieve character data for user : ' + user.username + ' : ' + err);
              return callback();
            }
              
            return parseUserData(user, data, function(err)
            {
              util.warn('Failed to parse character data for user : ' + user.username + ' : ' + err);
              callback();
            });
          });
        },
        function(err)
        {
          return callback(null, users);
        }); //End Async.Each
      },
    ],
    function(err, result)
    {
      if(err)
        util.err(err);
      return callback();
    });
  },
}