var async = require('async');
var http = require('http');
var util = require('../util');

module.exports = {

  query : function query_user_avatars(db, callback)
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
        .or([{ avatar : '' }, { avatar : '_default.jpg' }])
        .exec(function(err, docs)
        {
          //return callback(err, [0, 1, 2]);
          return callback(err, docs);
        });
      },
      function(users, callback)
      {
        //Query each user page in parallel.
        async.each(users, function(user, callback)
        {
          //Break down the user's character URL.
          var charUrl = /(?:[^:]*:\/\/)?(?:www\.)?([^\/]+\.[^\/]+)(.*)/.exec(user.charUrl);
        
          //Feed the URL into node's connect's http request.
          util.webGet(
          {
            hostname : charUrl[1],
            path : charUrl[2],
            //Spoof Firefox 19 User-Agent to avoid 302 Error.
            headers : {
              'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0',
            }
          },
          function(err, data){
            if(err)
              util.warn(err);
              
            //Slice out the URL.
            if(!err)
              user.avatar = /(http:\/\/img2.finalfantasyxiv.com\/f\/[^"]+)/.exec(data)[0];
            return callback();
          });
        },
        function()
        {
          return callback(null, users);
        }); //End Async.Each
      },
      
      //At this point the users now have a questionably valid .avatar URL.
      function(users, callback)
      {
        //Query each avatar in parallel.
        async.each(users, function(user, callback)
        {
          if(!user.avatar)
            return callback();
          
          //Break down the user's character URL.
          var avatar = /(?:[^:]*:\/\/)?(?:www\.)?([^\/]+\.[^\/]+)(.*)/.exec(user.avatar);
        
          var file;
          try
          {
            file = fs.createWriteStream(__dirname + '/../public/images/avatars/' + user.username + '.jpg')
          }
          catch(e)
          {
            return callback(e);
          }
            
          //Make web request
          util.webGet({
            hostname : avatar[1],
            path : avatar[2],
            method : 'GET',
            
            //Spoof Firefox 19 User-Agent to avoid 302 Error.
            headers : {
              'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0',
            },
            
          }, function(err)
          {
            util.log("Avatar response complete for User ID: " + user.username);
            user.avatar = user.username + '.jpg';
            
            //Run mongo Save as well; we don't need to wait for return from it.
            user.save();
            return callback(null);
          });
        },
        function(err)
        {
          return callback(err);
        });
      }
    ],
    function(err, results)
    {
      if(err)
        util.log(err);
        
      util.log("User Avatar Query Done.");
      return callback();
    });
  },
};