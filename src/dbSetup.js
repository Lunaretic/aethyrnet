var database = (require('./database.js'))();
var util = require('./util.js');
var async = require('async');


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


util.log("Testing LCS data..");
database.model('lcs_player').findOne({ name : 'Candy Panda' }, function(err, doc) {
	if((!err) && doc && doc.summonerName)
		return;
	util.warn("No LCS data found in DB.  Updating.");
	
	var players = [
		{
			name : 'Soaz',
			team : 'Fnatic',
			summonerId : '29900129',
		},
		{
			name : 'Cyanide',
			team : 'Fnatic',
			summonerId : '29880126',
		},
		{
			name : 'xPeke',
			team : 'Fnatic',
			summonerId : '29900130',
		},
		{
			name : 'Rekkles',
			team : 'Fnatic',
			summonerId : '29880127',
		},
		{
			name : 'Yellowstar',
			team : 'Fnatic',
			summonerId : '29900131',
		},
		{
			name : 'Froggen',
			team : 'Alliance',
			summonerId : '29900124',
		},
		{
			name : 'Tabbz',
			team : 'Alliance',
			summonerId : '29890124',
			summonerName : 'Alliance Tabbz',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Tabzz',
			rank : 10000
		},
		{
			name : 'Nyph',
			team : 'Alliance',
			summonerId : '29880125',
			summonerName : 'A Nyph',
			link : 'http://www.op.gg/summoner/userName=A%20Nyph',
			rank : 10000
		},
		{
			name : 'Shook',
			team : 'Alliance',
			summonerId : '29900125',
			summonerName : 'Alliance Shook',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Shook',
			rank : 10000
		},
		{
			name : 'Wickd',
			team : 'Alliance',
			summonerId : '29900126',
			summonerName : 'Alliance Wickd',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Wickd',
			rank : 10000
		},
		{
			name : 'Hai',
			team : 'Cloud 9',
			summonerId : '29890130',
		},
		{
			name : 'Balls',
			team : 'Cloud 9',
			summonerId : '29900136',
		},
		{
			name : 'LemonNation',
			team : 'Cloud 9',
			summonerId : '29880134',
		},
		{
			name : 'Sneaky',
			team : 'Cloud 9',
			summonerId : '29880135',
		},
		{
			name : 'Meteos',
			team : 'Cloud 9',
			summonerId : '29890131',
		},
		{
			name : 'Dyrus',
			team : 'TSM',
			summonerId : '29890126',
		},
		{
			name : 'Bjergsen',
			team : 'TSM',
			summonerId : '29880137',
		},
		{
			name : 'Amazing',
			team : 'TSM',
			summonerId : '29890127',
		},
		{
			name : 'Lustboy',
			team : 'TSM',
			summonerId : '29900134',
		},
		{
			name : 'WildTurtle',
			team : 'TSM',
			summonerId : '29890128',
		},
		{
			name : 'Candy Panda',
			team : 'SK',
			summonerId : '29880130',
			summonerName : 'Faded Sound',
			link : 'http://www.op.gg/summoner/userName=Faded%20Sound',
			rank : 10000
		},
		{
			name : 'nRated',
			team : 'SK',
			summonerId : '29880129',
			summonerName : 'HumbleBee69',
			link : 'http://www.op.gg/summoner/userName=HumbleBee69',
			rank : 10000
		},
		{
			name : 'Svenskeren',
			team : 'SK',
			summonerId : '29900133',
			summonerName : 'SK Jungler',
			link : 'http://www.op.gg/summoner/userName=SK%20Jungler',
			rank : 10000
		},
		{
			name : 'Jesiz',
			team : 'SK',
			summonerId : '29900132',
			summonerName : 'hipsterhippo',
			link : 'http://www.op.gg/summoner/userName=hipsterhippo',
			rank : 10000
		},
		{
			name : 'fredy122',
			team : 'SK',
			summonerId : '29880131',
			summonerName : 'mobywan',
			link : 'http://www.op.gg/summoner/userName=mobywan',
			rank : 10000
		},
	];
	async.each(players, function(player, callback) {
		
		var doc = database.model('lcs_player').findOne({ name: player.name }, function(err, doc){
			if(err ||  !doc)
				doc = new (database.model('lcs_player'))();
			
			doc.name = player.name;
			doc.team = player.team;
			doc.summonerId = player.summonerId;
			doc.summonerName = player.summonerName;
			doc.link = player.link;
			doc.rank = player.rank;
			
			doc.save();
			return callback();
		});
	}, function(err)
	{
		util.log("LCS data updated.");
	});
	
	
});