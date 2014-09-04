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
	wins : { type : Number, trim : true, default : 0 },
	losses : { type : Number, default : 0 },
	played : { type : Number, default : 0 },
	winRatio: { type : Number, default : 0 },
	rank : { type : Number, default : 10000 },
});

module.exports.lcs_player.index({ rank : 0 });