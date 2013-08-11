//Packaged Libraries
var passport = require('passport');
var bcrypt = require ('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;
var email = require('emailjs');
var aethyrForum = require('aethyr-forum');

//Local Libraries
var util = require('./util.js');

module.exports = {

  //-------------------------------------------------------
  //Setup authenticaion info for passport.
  //-------------------------------------------------------
  configurePassport : function configurePassport()
  {
    var database = (require('./database.js'))();
    
    util.log("Configuring Passport..");
    passport.use(new LocalStrategy(
      function(username, password, done) {
        database.model('user').findOne({ username: util.makeSlug(username) }, function (err, user) {
          util.log("Auth Request: " + username);
          if (err) {
            util.log(err);
            return done(err);
          }
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          
          //Todo: Make pw's into hashes, etc.
          bcrypt.compare(password, user.password, function(err, res) {
            if(res)
              return done(null, user);
            
            return done(null, false, { message: 'Incorrect password.' });
          });
        });
      }
    ));

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      util.log("Serialize attempt for ID: " + id);
      database.model('user').findById(id, function(err, user) {
        done(err, user);
      });
    });
  },
  
  configureForum : function configureForum()
  {
    util.log("Configuring Aethyr-Forum..");
    var database = (require('./database.js'))();
    aethyrForum.configure({
      database : database,
    });
  },
  
  configureMail : function configureEmail()
  {
    util.log("Configuring SMTP Email Connection..");
    //Connect to SMTP server.
    util.bindMailServer(email.server.connect({
      host        : "localhost", 
      domain      : 'localhost',
      port        : 25,
    }));
  },

};