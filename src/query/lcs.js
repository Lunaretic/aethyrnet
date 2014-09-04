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
					
					return callback(null, data);
				});
      },
			//Slice data up
			function(data, callback)
			{
				//Map down to just the data we actually want solo queue ratings.
				data = _.map(data, function(item){
					//Scan all their queue types.
					for(var idx in item){
						//We just want solo-queue.
						if(item[idx].queue === 'RANKED_SOLO_5x5')
						{
							//Perform data mapping.
							var retval = {
								summonerId : item[idx].entries[0].playerOrTeamId,
								league : item[idx].tier,
								division : item[idx].entries[0].division,
								lp : item[idx].entries[0].leaguePoints,
								wins : item[idx].entries[0].wins
							};
							return retval;
						}
					}
					return false;
				}).filter(function(item) {
					//Filter out bad results (anyone who hasn't finished their placements yet on their account).
					return item;
				});
				
				util.warn("Total LCS Count: " + data.length);
				return callback(null, data);
			},
			//Update Database.
			function(players, callback)
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
						doc.division = player.division;
						
						doc.save();
						return callback();
					});
				}, function(err)
				{
					return callback(null);
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