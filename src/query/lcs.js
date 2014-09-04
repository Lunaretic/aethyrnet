if (global.GENTLY) require = GENTLY.hijack(require);

var http = require('http');
var _ = require('underscore');
var util = require('../util.js');
var async = require('async');
var secrets = require('../secrets.js');

module.exports = {
  
  query : function query_lcs(db, callback){
    async.waterfall([
			function(callback) {
				
				db.model('lcs_player').find({}, 'summonerId', function(err, ids) {
					var summonerIds = '';
					for(var idx in ids)
					{
						if(summonerIds != '')
							summonerIds += ',';
						summonerIds += ids[idx].summonerId;
					}
					
					callback(null, summonerIds);
				});
			},
			//Retrieve data.
      function(summonerIds, callback)
      {
				util.warn("Triggering LCS Query");
				var path = '/api/lol/kr/v2.4/league/by-summoner/' + summonerIds + '/entry/?api_key=' + secrets.riot_api_key;
				
				util.webGet({
					hostname : 'kr.api.pvp.net',
					path : path,
					type : 'json',
				}, function(err, data, res)
				{
					if(err)
						return callback(err);
					
					return callback(null, data, summonerIds);
				});
      },
			//Slice data up
			function(data, summonerIds, callback)
			{
				//Map down to just the data we actually want solo queue ratings.
				data = _.map(data, function(item) {
					//Scan all their queue types.
					for(var idx in item)
					{
						//We just want solo-queue.
						if(item[idx].queue === 'RANKED_SOLO_5x5')
						{
							//Perform data mapping.
							var player = {
								summonerId : item[idx].entries[0].playerOrTeamId,
								league : item[idx].tier,
								division : item[idx].entries[0].division,
								lp : item[idx].entries[0].leaguePoints,
								wins : item[idx].entries[0].wins,
							};
							var rank = 10000;
							
							if(player.league == 'CHALLENGER')
								rank = 3000;
							else if(player.league == 'MASTER')
								rank = 4000;
							else if(player.league == 'DIAMOND')
								rank = 5000;
							else if(player.league == 'PLATINUM')
								rank = 6000;
							else if(player.league == 'GOLD')
								rank = 7000;
							else if(player.league == 'SILVER')
								rank = 8000;
							else if(player.league == 'BRONZE')
								rank = 9000;
							
							if(player.division == 'I')
								rank += 100
							else if(player.division == 'II')
								rank += 200
							else if(player.division == 'III')
								rank += 300
							else if(player.division == 'IV')
								rank += 400
							else if(player.division == 'V')
								rank += 500
							
							rank -= player.lp ? player.lp : 10000;
							player.rank = rank;
							return player;
						}
					}
					return false;
				}).filter(function(item) {
					//Filter out bad results (anyone who hasn't finished their placements yet on their account).
					return item;
				})
				
				return callback(null, data, summonerIds);
			},
			//Update Database with basic data.
			function(players, summonerIds, callback)
			{
				
				async.each(players, function(player, callback) {
					var doc = db.model('lcs_player').findOne({ summonerId : player.summonerId }, function(err, doc){
						if(err ||  !doc)
						{
							if(!doc)
								util.warn("Update failed for LCS Player ID: " + player.summonerId);
							return callback(err);
						}
						
						doc.wins = player.wins;
						doc.lp = player.lp;
						doc.league = player.league;
						doc.rank = player.rank;
						doc.division = player.division;
						
						doc.save();
						return callback();
					});
				}, function(err)
				{
					return callback(err, summonerIds);
				});
			},
			
			//Call to Riot DB per-player basis for their wins/losses.
			function(summonerIds, callback)
			{
				var summonerIds = summonerIds.split(',');
				//For each player; in order, with a rate limit.
				async.eachSeries(summonerIds, function(summonerId, callback)
				{
					//Perform some actions
					async.waterfall([
						//Starting with an API request to riot.
						function(callback)
						{
							var path = '/api/lol/kr/v1.3/stats/by-summoner/' + summonerId + '/ranked?season=SEASON4&api_key=' + secrets.riot_api_key;
							
							util.webGet({
								hostname : 'kr.api.pvp.net',
								path : path,
								type : 'json',
							}, function(err, data, res)
							{
								if(err)
									return callback(err);
								
								return callback(null, data);
							});
						},
						//Manipulate the data returned from the server.
						function(data, callback)
						{
							var data = _.filter(data.champions, function(champ)
							{
								return champ.id == 0;
							});
							
							data = data[0].stats;
							
							var mapped = {
								wins : data.totalSessionsWon,
								played : data.totalSessionsPlayed,
								losses : data.totalSessionsLost,
								winRatio : Math.floor(data.totalSessionsWon/data.totalSessionsPlayed * 100)
							};
							
							return callback(null, mapped);
						}, 
						//Update the database with our new win/loss data.
						function(data, callback)
						{
							var doc = db.model('lcs_player').findOne({ summonerId : summonerId }, function(err, doc){
								if(err ||  !doc)
								{
									if(!doc)
										util.warn("Win/Loss update failed for LCS Player ID: " + summonerId);
									return callback(err);
								}
								
								doc.wins = data.wins;
								doc.losses = data.losses;
								doc.played = data.played;
								doc.winRatio = data.winRatio;
								
								doc.save();
								
								//Sleep for an extra second before we move onto the next player.
								//This is to make sure we don't hit RIOT's rate limiter.
								setTimeout(callback, 1000);
							});
						},
					],function(err)
					{
						//Unranked players will throw a 404 Error.
						callback();
					});
				},
				function(err)
				{
					return callback(err);
				});
			
			}
    ], function(err, results)
    {
      if(err)
        util.err(err);
			else
				util.log("LCS data updated.");
			
      //Final CB
      return callback();
    });
  },
}