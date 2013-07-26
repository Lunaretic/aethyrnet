mongoose = require('mongoose');

module.exports.feedEntry = new mongoose.Schema({
  //The only required value.
  title : { type : String, unique : true, trim : true, required : true },
  source : { type : String, trim : true },
  image : { type : String, default : 'meteor.png' },
  imageLink : { type : String, trim : true },
  link : { type : String, trim : true },
  content : { type : String, trim : true },
  date : { type : Date, required : true },
});

module.exports.feedEntry.index({ date : 1 });