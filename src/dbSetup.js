var database = (require('./database.js'))();
var util = require('./util.js');

database.model('hunt_zone').findOne({ name : 'Coerthas'}, function(err, doc) {
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
		'La Norscea' : {
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
	
	for(var region in regions) {
		for(var zone in regions[region]) {
			var bName = regions[region][zone]['B'];
			var aName = regions[region][zone]['A'];
			var sName = regions[region][zone]['S'];
			
			regions[region][zone]['B'] = { name : bName };
			regions[region][zone]['A'] = { name : aName };
			regions[region][zone]['S'] = { name : sName };
			
			var zName = zone + ( region != 'Other' ? ' ' + region : '' );
			var query = database.model('hunt_zone').findOneAndUpdate(
			{ name: zName},
			{
				B : regions[region][zone]['B'],
				A : regions[region][zone]['A'],
				S : regions[region][zone]['S'],
        telepoint : regions[region][zone]['telepoint']
			}, { upsert : true });
			query.exec();
		}
	}
	util.log("Hunt data updated.");
});