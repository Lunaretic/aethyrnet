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
database.model('lcs_player').findOne({ name : 'Bjergsen' }, function(err, doc) {
	if(!err && doc && doc.link == 'http://www.op.gg/summoner/userName=Nesgrejb')
		return;
	util.warn("No LCS data found in DB.  Updating.");
	
	var players = [
		{
			name : 'Soaz',
			team : 'Fnatic',
			summonerName : 'flyingpoop',
			summonerId : '29900129',
			link : 'http://www.op.gg/summoner/userName=flyingpoop',
			rank : 10000
		},
		{
			name : 'Cyanide',
			team : 'Fnatic',
			summonerName : 'Ding12',
			summonerId : '29880126',
			link : 'http://www.op.gg/summoner/userName=Ding12',
			rank : 10000
		},
		{
			name : 'xPeke',
			team : 'Fnatic',
			summonerName : '짱짱 잘 생긴 게',
			summonerId : '29900130',
			link : 'http://www.op.gg/summoner/userName=%EC%A7%B1%EC%A7%B1%20%EC%9E%98%20%EC%83%9D%EA%B8%B4%20%EA%B2%8C',
			rank : 10000
		},
		{
			name : 'Rekkles',
			team : 'Fnatic',
			summonerName : 'European Deft',
			summonerId : '29880127',
			link : 'http://www.op.gg/summoner/userName=European%20Deft',
			rank : 10000
		},
		{
			name : 'Yellowstar',
			team : 'Fnatic',
			summonerName : 'roro1',
			summonerId : '29900131',
			link : 'http://www.op.gg/summoner/userName=roro1',
			rank : 10000
		},
		{
			name : 'Froggen',
			team : 'Alliance',
			summonerName : 'Alliance Froggen',
			summonerId : '29900124',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Froggen',
			rank : 10000
		},
		{
			name : 'Tabbz',
			team : 'Alliance',
			summonerName : 'Alliance Tabzz',
			summonerId : '29890124',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Tabzz',
			rank : 10000
		},
		{
			name : 'Nyph',
			team : 'Alliance',
			summonerName : 'A Nyph',
			summonerId : '29880125',
			link : 'http://www.op.gg/summoner/userName=A%20Nyph',
			rank : 10000
		},
		{
			name : 'Shook',
			team : 'Alliance',
			summonerName : 'Alliance Shook',
			summonerId : '29900125',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Shook',
			rank : 10000
		},
		{
			name : 'Wickd',
			team : 'Alliance',
			summonerName : 'Alliance Wickd',
			summonerId : '29900126',
			link : 'http://www.op.gg/summoner/userName=Alliance%20Wickd',
			rank : 10000
		},
		{
			name : 'Hai',
			team : 'Cloud 9',
			summonerName : 'KvotheKelsier',
			summonerId : '29890130',
			link : 'http://www.op.gg/summoner/userName=KvotheKelsier',
			rank : 10000
		},
		{
			name : 'Balls',
			team : 'Cloud 9',
			summonerName : 'EunjiSuzy',
			summonerId : '29900136',
			link : 'http://www.op.gg/summoner/userName=EunjiSuzy',
			rank : 10000
		},
		{
			name : 'LemonNation',
			team : 'Cloud 9',
			summonerName : '넌나한태오빠야',
			summonerId : '29880134',
			link : 'http://www.op.gg/summoner/userName=%EB%84%8C%EB%82%98%ED%95%9C%ED%83%9C%EC%98%A4%EB%B9%A0%EC%95%BC',
			rank : 10000
		},
		{
			name : 'Sneaky',
			team : 'Cloud 9',
			summonerName : 'C9 Sneaker',
			summonerId : '29880135',
			link : 'http://www.op.gg/summoner/userName=C9%20Sneaker',
			rank : 10000
		},
		{
			name : 'Meteos',
			team : 'Cloud 9',
			summonerName : 'ice cold water',
			summonerId : '29890131',
			link : 'http://www.op.gg/summoner/userName=ice%20cold%20water',
			rank : 10000
		},
		{
			name : 'Dyrus',
			team : 'TSM',
			summonerName : 'suryd',
			summonerId : '29890126',
			link : 'http://www.op.gg/summoner/userName=suryd',
			rank : 10000
		},
		{
			name : 'Bjergsen',
			team : 'TSM',
			summonerName : 'Nesgrejb',
			summonerId : '29880137',
			link : 'http://www.op.gg/summoner/userName=Nesgrejb',
			rank : 10000
		},
		{
			name : 'Amazing',
			team : 'TSM',
			summonerName : 'Maaamba',
			summonerId : '29890127',
			link : 'http://www.op.gg/summoner/userName=Maaamba',
			rank : 10000
		},
		{
			name : 'Lustboy',
			team : 'TSM',
			summonerName : 'GET OUTTA MY BOT',
			summonerId : '29900134',
			link : 'http://www.op.gg/summoner/userName=GET%20OUTTA%20MY%20BOT',
			rank : 10000
		},
		{
			name : 'WildTurtle',
			team : 'TSM',
			summonerName : 'American IMP',
			summonerId : '29890128',
			link : 'http://www.op.gg/summoner/userName=American%20IMP',
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
			doc.sommonerName = player.summonerName;
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