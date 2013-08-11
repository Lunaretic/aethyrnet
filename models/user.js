mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.user = new mongoose.Schema({

  //Basic info
  username : { type : String, required : true, unique : true, trim : true, lowercase : true },
  password : { type : String, trim : true, required : true },
  
  //Website BG
  bgImage : { type : String, trim : true, lowercase : true, default : 'gridania' },
  
  //Email -- Add Validator later.
  email : { type : String, trim : true, lowercase : true },
  
  //Character URL - Validator?
  charUrl : { type : String, trim : true, lowercase : true },
  
  avatar : { type : String, trim : true, default : '_default.jpg' },
  
  sidebarSticky : { type : Boolean, default : false },
  
  sidebarOrientation : { type : String, trim : true, default : 'right' },
  
  //0 Gues, 1 User, 2 Guildie, 3 Officer, 4 Leader, 5 SuperAdmin
  adminLevel : { type : Number, min : 1, max : 5, default : 1 },
  
});

var regexValidator = {
  username : /^[0-9a-z ]*$/,
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