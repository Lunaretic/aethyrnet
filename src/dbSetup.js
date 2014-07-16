var database = (require('./database.js'))();
var util = require('./util.js');
var async = require('async');

database.model('hunt_zone').find({ name : /orscea/ }, function(err, docs) {
	for(var idx in docs)
	{
		docs[idx].name = docs[idx].name.replace('Norscea', 'Noscea')
		docs[idx].save();
	}
});

setTimeout(function() {

	util.log("Testing hunt data..");
	database.model('hunt_zone').findOne({ name : 'Eastern La Noscea'}, function(err, doc) {
		if(!err && doc)
			return;
		util.warn("No Hunt data found in DB.  Updating.");
		var regions = {
			'Thanalan' : {
				'Central' : {
					'telepoint' : 'Black Brush Station',
					'B' : 'Ovjang',
					'A' : 'Sabotender Bailarina',
					'S' : 'Brontes',
				},
				'Eastern' : {
					'telepoint' : 'Camp Drybone',
					'B' : 'Gattling',
					'A' : 'Maahes',
					'S' : 'Lampalagua',
				},
				'Western' : {
					'telepoint' : 'Camp Horizon',
					'B' : 'Sewer Syrup',
					'A' : 'Alectryon',
					'S' : 'Zona Seeker',
				},
				'Northern' : {
					'telepoint' : 'Camp Bluefog / Ceruleum Processing Plant',
					'B' : 'Flame Seargent Dalvag',
					'A' : 'Dalvag\'s Final Flame',
					'S' : 'Minhocao',
				},
				'Southern' : {
					'telepoint' : 'Little Ala Mihgo / Forgotten Springs',
					'B' : 'Albin the Ashen',
					'A' : 'Zanig\'oh',
					'S' : 'Nunyunuwi',
				}
			},
			'Shroud' : {
				'North' : {
					'telepoint' : 'Fallgourd Float',
					'B' : 'Phecda',
					'A' : 'Girtab',
					'S' : 'Thousand-cast Theda',
				},
				'Eastern' : {
					'telepoint' : 'Hawthorne Hut',
					'B' : 'Stinging Sophie',
					'A' : 'Melt',
					'S' : 'Wulgaru',
				},
				'Central' : {
					'telepoint' : 'Bentbranch Meadows',
					'B' : 'White Joker',
					'A' : 'Forneus',
					'S' : 'Laideronnette',
				},
				'South' : {
					'telepoint' : 'Quarrymill / Camp Tranquil',
					'B' : 'Monarch Ogrefly',
					'A' : 'Ghede Ti Malice',
					'S' : 'Mindflayer',
				},
			},
			'La Noscea' : {
				'Western' : {
					'telepoint' : 'Aleport / Swiftperch',
					'B' : 'Dark Helmet',
					'A' : 'Nahn',
					'S' : 'Bonnacon',
				},
				'Middle' : {
					'telepoint' : 'Summerford Farms',
					'B' : 'Skogs Fru',
					'A' : 'Vogaal Ja',
					'S' : 'Croque-Mitaine',
				},
				'Lower' : {
					'telepoint' : 'Moraby Drydocks',
					'B' : 'Barbastelle',
					'A' : 'Unktehi',
					'S' : 'Croakadile',
				},
				'Upper' : {
					'telepoint' : 'Camp Iron Lake',
					'B' : 'Myradrosh',
					'A' : 'Marberry',
					'S' : 'Nandi',
				},
				'Outer' : {
					'telepoint' : 'Camp Overlook',
					'B' : 'Vuokho',
					'A' : 'Cornu',
					'S' : 'Mahishia',
				},
				'Eastern' : {
					'telepoint' : 'Costa Del Sol / Wineport',
					'B' : 'Bloody Mary',
					'A' : 'Hellsclaw',
					'S' : 'Garlok'
				}
			},
			'Other' : {
				'Coerthas' : {
					'telepoint' : 'Camp Dragonhead',
					'B' : 'Naul',
					'A' : 'Marraco',
					'S' : 'Safat',
				},
				'Mor Dhonna' : {
					'telepoint' : 'Revenant\'s Toll',
					'B' : 'Leech King',
					'A' : 'Kurrea',
					'S' : 'Agrippa',
				}
			}
		};
		
		
		var zones = [];
		for(var region in regions) {
			for(var zone in regions[region]) {
				var bName = regions[region][zone]['B'];
				var aName = regions[region][zone]['A'];
				var sName = regions[region][zone]['S'];
				var telepoint = regions[region][zone]['telepoint'];
				var zName = zone + ( region != 'Other' ? ' ' + region : '' );
				
				zones.push({
					name : zName,
					B : bName,
					A : aName,
					S : sName,
					telepoint : telepoint
				});
			}
		}
		
		async.each(zones, function(zone, callback) {
			util.warn("Updating: " + zone.name);
			var doc = database.model('hunt_zone').findOne({ name: zone.name }, function(err, doc){
				if(err ||  !doc)
					doc = new (database.model('hunt_zone'))();
				
				doc.name = zone.name;
				doc.B = {
					name : zone.B,
					tod : doc.B ? doc.B.tod : new Date(0)
				};
				doc.A = {
					name : zone.A,
					tod : doc.A ? doc.S.tod : new Date(0)
				};
				doc.S = {
					name : zone.S,
					tod : doc.S ? doc.S.tod : new Date(0)
				};
				doc.telepoint = zone.telepoint;
				
				doc.save();
			});
		}, function(err)
		{
			util.log("Hunt data updated.");
		})
		
	});
}, 10000);