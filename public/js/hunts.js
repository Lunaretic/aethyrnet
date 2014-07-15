aethyrnet.backbone['hunts'] = new (function(){

	//Regions constant.
	var regions = ['Thanalan', 'Shroud', 'La Norscea', 'Other'];
	var types = ['B','A','S'];
	var respawn_time = { B : 30, A : 210, S : 1440 };
	var respawn_max = { B : 60, A : 270, S: 2880 };
	var page = this;
	
  //----------------------------------------
  //            Hunts Page
  //----------------------------------------
	
	//-----  Primary View -----
  this.HuntView = aethyrnet.PageView.extend({
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
    className : 'content-block container',
		
		initialize : function(options) {
		},
		
		render : function(template) {
			var view = this;
			var targets = this.collection.pluck('B').concat(this.collection.pluck('A')).concat(this.collection.pluck('S'));
			
			targets = _.filter(targets, function(mdl) {
				return mdl.active > 0;
			});
			
			targets = _.sortBy(targets,function(mdl) {
				return (mdl.active * -10000) + mdl.estimated;
			});
			
			this.$el.html('');
			if(targets.length > 0)
			{
				this.$el.html(template({ targets : targets }));
			}
		}
		
	});
	
  var HuntRegionView = this.HuntRegionView = Backbone.View.extend({
    initialize : function(options)
    {
			this.parent = options.parent;
    },
    
    render : function(template)
    {
      this.$el.html(template({ zone : this.model.attributes }));
			var view = this;
      $('.update', this.$el).click(function(evt) {
        var $btn = $(evt.target);
        var root = $btn.closest('.row');
				
				var huntClass = 'S'
				if(root.hasClass('hunt-a'))
					huntClass = 'A';
				else if(root.hasClass('hunt-b'))
					huntClass = 'B';
				
				$.post('/api/hunt_update', { 
					zone : view.model.get('name'),
					huntClass : huntClass
				}, function(data, textStat) {
					view.parent.refresh.call(view.parent);
				}, "json");
      });
    },
  });
  
  
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