mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.user = new mongoose.Schema({

  //Basic info
  username : { type : String, required : true, unique : true, trim : true, lowercase : true, default : 'anonymous' },
  password : { type : String, trim : true, required : true },
  
  //Website BG
  bgImage : { type : String, trim : true, lowercase : true, default : 'gridania' },
  
  //Email -- Add Validator later.
  email : { type : String, trim : true, lowercase : true, default : '' },
  
  //Character URL - Validator?
  charUrl : { type : String, trim : true, lowercase : true, default : '' },
  
  charName : { type : String, trim : true, lowercase : true, default : '' },
  
  avatar : { type : String, trim : true, default : '_default.jpg' },
  
  sidebarSticky : { type : Boolean, default : false },
  
  sidebarOrientation : { type : String, trim : true, default : 'right' },
  
  //0 Guest, 1 User, 2 Guildie, 3 Officer, 4 Leader, 5 SuperAdmin
  adminLevel : { type : Number, min : 1, max : 5, default : 1 },
  
  primaryJob : { type : String, trim : true, default : '' },
  secondaryJob : { type : String, trim : true, default : '' },
  
  preferredActivity : { type : String, trim : true, default : '' },
  
});

var regexValidator = {
  username : /^[0-9a-z_]*$/,
  email : /^$|^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
  charUrl : /^$|^http\:\/\/[a-z.]*finalfantasyxiv\.com\/lodestone\/character\/[0-9]*\/$/,
};
module.exports.user.path('username').validate(function (username) 
{
  //Ensure RegEx fails on 
  return ( regexValidator.username.test(username) )
}, 'Invalid Username - May only include Alphanumeric characters and spaces.');

module.exports.user.path('email').validate(function (email) 
{
  return ( regexValidator.email.test(email) )
}, 'Invalid Email.');

module.exports.user.path('charUrl').validate(function (charUrl) 
{
  return ( regexValidator.charUrl.test(charUrl) )
}, 'Lodestone Character URL not valid.');

//Shred password data when converting to JSON or Object.
module.exports.user.options.toObject = module.exports.user.options.toJSON = {
  getters : true,
  minimize : false,
  transform : function (doc, ret, options) {
    // Remove password
    delete ret.password;
  }
};