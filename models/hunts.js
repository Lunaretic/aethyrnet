mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.hunt_zone = new mongoose.Schema({
	name : { type : String, required : true, unique : true, trim : true },
	B : { name : String, tod : Date },
	A : { name : String, tod : Date },
	S : { name : String, tod : Date },
	telepoint : String
});