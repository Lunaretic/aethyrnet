mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.character = new mongoose.Schema({
  
  //Their ###### ID for the lodestone.
  lodestoneId : { type : Number, required : true, unique : true },
  
  //Basic character info.
  name : { type : String, trim : true },
  race : { type : String, trim : true },
  clan : { type : String, trim : true },
  
  //Alleigance info.
  fc : { type : String, trim : true },
  gc : { type : String, trim : true },
  
  //Job info.
  primaryJobLevel : { type : Number, min : 0, max : 50 },
  secondaryJobLevel : { type : Number, min : 0, max : 50 },
  
  //Avatar & related images.
  avatar : { type : String, trim : true },
  
});