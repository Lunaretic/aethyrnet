mongoose = require('mongoose');

module.exports.lcs_player = new mongoose.Schema({
  //The only required value.
  name : { type : String, unique : true, trim : true, required : true },
	team : { type : String, trim : true },
	summonerName : { type : String, trim: true, unique : true},
  summonerId : { type : String, trim : true, unique : true},
  league : { type : String, trim : true },
  division : { type : String, trim : true },
  lp : { type : Number, trim : true },
	wins : { type : Number, trim : true },
	losses : { type : Number, trim : true },
});