mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.hunt_zone = new mongoose.Schema({
	name : { type : String, required : true, unique : true, trim : true },
	B : { name : String, tod : Date, reporter : String },
	A : { name : String, tod : Date, reporter : String },
	S : { name : String, tod : Date, reporter : String },
	telepoint : String
});

module.exports.hunt_metric = new mongoose.Schema({
	name : { type : String, required : true, unique : true, trim : true },
	respawnTimes : [Number]
});