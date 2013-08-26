var async = require('async');
var util = require('../util');
var cheerio = require('cheerio');
var database = require('../database.js')();

//Data we need to retreive, and functions to recover it from the DOM.
var characterFields = {
  'name' : function($)
  {
    var elem = $('.area_header .player_name_brown a');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.text();
  },
  'race' : function($)
  {
    var elem = $('.area_header .chara_profile_title');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.text().split('/')[0].trim();
  },
  'clan' : function($)
  {
    var elem = $('.area_header .chara_profile_title');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.text().split('/')[1].trim().slice(0,-2);
  },
  'fc' : function($)
  {
    var elem = $('.area_header li.clearfix:last-child strong a.txt_yellow');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.text();
  },
  'server' : function($)
  {
    var elem = $('.area_header .area_footer.mb0 h2.player_name_brown span');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.text().slice(1,-1);
  },
  'gc' : function($)
  {
    var elem = $($('.area_header li.clearfix')[2]).find('strong.txt_yellow');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.text().split('/')[0].trim();
  },
  'primaryJobLevel' : function($, user)
  {
    //TODO: Read off user data and figure out best way to find specifically that class info.
    return 0;
  },
  'secondaryJobLevel' : function($, user)
  {
    //TODO: Read off user data and figure out best way to find specifically that class info.
    return 0;
  },
  'avatar' : function($)
  {
    var elem = $('.area_header .area_footer.mb0 .thumb_cont_black_40.mr10 a img');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    return elem.attr('src');
  },
  'validation' : function($, user)
  {
    if(user.charValidated)
      return true;
    
    if(!user.charValidationString)
      return false;
    
    var elem = $('.area_inner_header .area_inner_footer .txt_selfintroduction');
    if(elem.length !== 1)
      throw("Document was not properly formatted.");
    
    if(elem.text().indexOf(user.charValidationString) === -1)
      return false;
    
    return true;
  }
};


  
module.exports = {

  parseUserData : function parseUserData(user, data, callback)
  {
    //Watch for malformed HTML/etc.
    try
    { 
      var $ = cheerio.load(data);
    }
    catch(e)
    {
      return callback(e);
    }
    
    charData = {
      lodestoneId : user.charId,
    };
    
    var idx;
    try
    {
      //Loop all fields desired.
      for(idx in characterFields)
      {
        charData[idx] = characterFields[idx]($, user);
      }
    }
    catch(e)
    {
      return callback(idx + " : " + e);
    }
    
    //Get rid of validation check.
    delete charData[idx].validation;
    
    
    database.model('character').update({
      lodestoneId : user.charId,
    }, charData, { 
      upsert : true,
    }, function(err){
        return callback(err)
    });
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
        .select('username charUrl charValidated charValidationString')
        .where('charUrl').gt('')
        //.where('charValidated').ne(false) 
        .exec(function(err, docs)
        {
          util.warn("Total Users queued for update: " + docs.length);
          //return callback(err, [0, 1, 2]);
          return callback(err, docs);
        });
      },
      function(users, callback)
      {        
        //Create an array of functions, which are the update
        //functions for each user.
        var charFunctions = []
        for(var idx in users)
        {
          //Create a partial binding, such that the user is (this),
          // and a callback remains to be passed in.
          charFunctions.push(function(callback)
          {
            module.exports.getUserData(this, callback);
          }.bind(users[idx]));
        }
        
        //Loop the character's retreival functions.
        async.waterfall(charFunctions,
        function(err)
        {
          return callback(err);
        }); //End Waterfall
      },
    ],
    function(err, result)
    {
      if(err)
        util.err(err);
      
      return callback();
    });
  },
  
  getUserData : function getUserData(user, callback)
  {
    util.log("Attempting to retreive lodestone data for user: " + user.username);
    
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
      
      return module.exports.parseUserData(user, data, function(err)
      {
        if(err)
          util.warn('Failed to parse character data for user : ' + user.username + ' : ' + err);
        
        
        util.log("Character data retreival/update complete.");
        return callback();
      });
    });
  },
}