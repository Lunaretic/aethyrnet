aethyrnet.backbone['hunts'] = new (function(){

	//Regions constant.
	var regions = ['Thanalan', 'Shroud', 'La Noscea', 'Other'];
	var types = ['B','A','S'];
	var respawn_time = { B : 30, A : 210, S : 1440 };
	var respawn_max = { B : 60, A : 270, S: 2880 };
	var page = this;
	
	//----------------------------------------
	//            Hunts Page
	//----------------------------------------
	
	//-----  Primary View -----
	this.HuntView = aethyrnet.PageView.extend({
		//Set up Security options
		security : {
			loggedIn : true,
			adminLevel : 2
		},
		initializePage : function(options)
		{
		var view = this;
			this.collection = new Zones();
			
		async.parallel([
		function(callback) {
			//Retrieve child template.
			getTemplate('hunt_zones', {}, function(err, context)
			{
				view.childTemplate = context;
				callback();
			});
		},
		function(callback) {
			//Retrieve child template.
			getTemplate('hunt_upcoming', {}, function(err, context)
			{
				view.upcomingTemplate = context;
				callback();
			});
		},
		getTemplate.bind(this, 'hunt_viewport', {css : true, view : view, mainCss : true }),
		function(callback) {
			view.fetch(callback);
		},
		],
		function(err, result)
		{
			page.modalTemplate = view.template;
			view.render.call(view);
			//Auto-refresh every 60 seconds.
			view.refreshTimer = window.setTimeout(view.refresh.bind(view), 60000);
		});
	},
		
		//Fetches new data and reinitializes subviews.
		fetch : function(callback)
		{
			var view = this;
			
			if(this.zoneViews)
				delete this.zoneViews;
			
			this.zoneViews = [];
			//Retrieve JSON data for our core listing.
			view.collection.fetch({
				success : function(results, response, options) {
				//Scoping factory to spawn views.
				function tempFact(mdl)
				{
					var fev = new HuntRegionView({
						parent : view,
						model : mdl,
					});
					view.zoneViews.push(fev);
					return fev;
				}
				
				//Create subviews for each model we get from the server.
				for(var idx in results.models)
				{
					var fev = tempFact(results.models[idx]);
				}
				
				view.upcomingHunts = new UpcomingHuntsView({
					parent: view,
					collection : view.collection,
				})
				
				
				return callback();
				},
			});
		},

		refresh : function() {
			if(this.refreshTimer)
				window.clearTimeout(this.refreshTimer)
			
			//Auto-refresh every 60 seconds.
			this.refreshTimer = window.setTimeout(this.refresh.bind(this), 60000);
		
			//Re-render after a clean fetch.
			this.fetch(this.renderPage.bind(this));
		},
		
	renderPage : function() {
		var view = this;
		view.$el.html('');
			
			view.$el.append(view.upcomingHunts.el);
			view.upcomingHunts.render(view.upcomingTemplate);
			
			for(var idx in regions) {
				view.$el.append('<div id="'+regions[idx].replace(' ', '_')+'" class="content-block container"></div>');
			}

		for(var idx in view.zoneViews) {
		$('#'+view.zoneViews[idx].model.get('region').replace(' ', '_'), view.$el).append(view.zoneViews[idx].el);
		view.zoneViews[idx].render(view.childTemplate);
		}
	},

	remove : function() {

		//Kill our subviews.
		for(var idx in this.zoneViews)
		this.zoneViews[idx].remove();
			
			delete this.zoneViews;
			
			if(this.upcomingHunts)
				this.upcomingHunts.remove();
			
			delete this.upcomingHunts;

		$.removeData(this.$el);

		//Summon base backbone removal.
		Backbone.View.prototype.remove.call(this);
	},
	});

	//----------------------------------
	//          Child Views
	//-----------------------------------
	var UpcomingHuntsView = this.UpcomingHuntsView = Backbone.View.extend({
		className : 'upcoming-hunts-container',
		
		events : {
			'click .upcoming-target' : 'showDialog'
		},
		
		initialize : function(options) {
			this.parent = options.parent;
		},
		
		showDialog : function(evt)
		{
			//Find the hunt target in the original collection.
			var elem = $(evt.currentTarget);
			
			var zone = this.parent.collection.find(function(z) {
				return z.get('name') == elem.attr('data-zone');
			});
			
			if(!zone)
				return console.log('Failed to find zone.');
			
			var target = zone.get(elem.attr('data-hunttype'));
			
			openModal(target);
			
		},
		
		render : function(template) {
			var view = this;
			var bTargets = this.collection.pluck('B');
			var aTargets = this.collection.pluck('A');
			var sTargets = this.collection.pluck('S');
			
			var filter = function(mdl) {
				if(mdl.active == 0)
					return false;
				
				return true;
			};
			
			bTargets = _.filter(bTargets, filter);
			aTargets = _.filter(aTargets, filter);
			sTargets = _.filter(sTargets, filter);
			
			bTargets = _.sortBy(bTargets,function(mdl) {
				return (mdl.active * -10000) + mdl.estimated;
			});
			aTargets = _.sortBy(aTargets,function(mdl) {
				return (mdl.active * -10000) + mdl.estimated;
			});
			sTargets = _.sortBy(sTargets,function(mdl) {
				return (mdl.active * -10000) + mdl.estimated;
			});
			
			this.$el.html(template({
				targetTypes : {
					'B' : _.first(bTargets, 6),
					'A' : _.first(aTargets, 6),
					'S' : _.first(sTargets, 6)
				}
			}));
		}
		
	});
	
	var HuntRegionView = this.HuntRegionView = Backbone.View.extend({
    events : {
      'click .update' : 'updateOpen',
    },
  
    initialize : function(options)
    {
        this.parent = options.parent;
    },

    render : function(template)
    {
      this.$el.html(template({ zone : this.model.attributes }));
        var view = this;
    },
    
    updateOpen : function(evt) {
			var view = this;
      var $btn = $(evt.target);
      var root = $btn.closest('.row');
			
      var huntClass = 'S'
      if(root.hasClass('hunt-A'))
        huntClass = 'A';
      else if(root.hasClass('hunt-B'))
        huntClass = 'B';
			
			openModal(this.model.get(huntClass));
    }
	});

	var openModal = this.openModal = function openModal(attributes)
	{
		var $html = $(page.modalTemplate(attributes));
		
		$(document.body).append($html);
		$html.modal({
			show : true,
			keyboard : true,
		});
		$html.delay(200).queue('fx', function(next)
		{
			$('#update-tod', $html).focus();
			next();
		});
		$html.on('hidden.bs.modal', function(){
			$html.remove();
		});
		
		var submitModal = function(evt) {
			var timestring = $('#update-tod').val();
			try
			{
				var hours = timestring.split(':')[0];
				var minutes = timestring.split(':')[1];
				
				var dt = new Date();
				dt.setHours(hours);
				dt.setMinutes(minutes);
				
				if(dt > new Date())
					dt.setHours(dt.getHours() - 24);
				
				if(isNaN(dt.getTime()))
					return aethyrnet.error("The given time is not valid.");
				
				$.post('/api/hunt_update', { 
					zone : attributes.zone,
					huntClass : attributes.type,
					tod : dt
				}, function(data, textStat) {
					aethyrnet.viewport.mainView.refresh();
				}, "json");
				$html.modal('hide');
			} catch(e) {
				aethyrnet.error('The time appears to be invalid or the server is down.');
			}
		};
		
		$('.submit-btn', $html).on('click',submitModal);
		$('#update-tod', $html).on('keyup', function(evt){
      if(event.keyCode == 13) {
				return submitModal.call(this, evt);
			}
		});
	};
	

	//----------------------------------------
	//                Models
	//----------------------------------------
	var Zone = this.Zone= Backbone.Model.extend({

	idAttribute: "_id",
	initialize : function(attributes, options)
	{
			//Set up the extra hunt-spawning related data.
			for(var idx in types) {
				var name = attributes[types[idx]].name;
				var tod = attributes[types[idx]].tod ? new Date(attributes[types[idx]].tod) : false;
				var active = 1;
				var rtime = respawn_time[types[idx]];
				var rtimeMax = respawn_max[types[idx]];
				
				//Differential in minutes between last ToD and now.
				var estimated = 9999;
				var minutesSinceSpawn = Math.floor(attributes[types[idx]].tod ? ((new Date() - new Date(attributes[types[idx]].tod)) / 1000 / 60): 9999);
				
				//If we're out of our valid range on either side.
				if(minutesSinceSpawn > rtimeMax) {
					active = 0;
					estimated = 9999;
					tod = false;
				} else if(minutesSinceSpawn >= rtime && minutesSinceSpawn <= rtimeMax){
					active = 2;
					estimated = rtimeMax - minutesSinceSpawn;
				} else {
					active = 1;
					estimated = rtime - minutesSinceSpawn;
				}
				
				this.attributes[types[idx]].tod = tod;
				this.attributes[types[idx]].estimated = estimated;
				this.attributes[types[idx]].active = active;
				this.attributes[types[idx]].type = types[idx];
				this.attributes[types[idx]].zone = attributes.name;
			}
			
			//Group us into our appropriate Region as well.
			for(var idx in regions) {
				if(this.attributes.name.indexOf(regions[idx]) != -1)
					this.attributes.region = regions[idx];
			}
			if(!this.attributes.region)
				this.attributes.region = 'Other';
	},
	});

	//----------------------------------------
	//              Collections
	//----------------------------------------
	var Zones = this.Zones = Backbone.Collection.extend({

	model : Zone,
	url : "/api/hunts",

	});


})();