aethyrnet.backbone['hunts'] = new (function(){
  //----------------------------------------
  //            Hunts Page
  //----------------------------------------
  this.HuntView = aethyrnet.PageView.extend({
  
    
    initializePage : function(options)
    {
      this.subviews = [];
      var view = this;
      this.collection = new Zones();
      async.parallel([
        function(callback) {          
          //Retrieve template files.
          getTemplate('hunts', { css : true, view : view, mainCss : true }, function(err, context)
          {
            callback();
          }.bind(this));
        },
        function(callback) {
          //Retrieve JSON data.
          view.collection.fetch({ 
            success : function(results, response, options) {
            //Scoping factory to spawn views.
            function tempFact(mdl)
            {
              var fev = new HuntRegionView({
                model : mdl,
              });
              view.subviews.push(fev);
              return fev;
            }
            
            //Create subviews for each model we get from the server.
            for(var idx in results.models)
            {
              var fev = tempFact(results.models[idx]);
            }
            return callback();
              callback();
            },
          });
        },
      ],
      function(err, result)
      {
        view.render.call(view);
      });
    },
    
    renderPage : function(args) {
      var view = this;
      this.$el.html('');
      
      for(var idx in this.subviews) {
        this.$el.append(this.subviews[idx].el);
        this.subviews[idx].render(this.template);
      }
      
      $('.update', this.$el).click(function(evt) {
        var $btn = $(evt.target);
        var root = $btn.nearest('.row');
        
      });
    },
    
    remove : function() {
      delete this.subviews;
    
      //Kill our subviews.
      for(var idx in this.subviews)
        this.subviews[idx].remove();
      
      $.removeData(this.$el);
      
      //Summon base backbone removal.
      Backbone.View.prototype.remove.call(this);
    },
  });
  
  var HuntRegionView = this.HuntRegionView = Backbone.View.extend({
    
    className : '',
    
    initialize : function()
    {
			//Update the underlying hunt data with data
			//we want to use in the template.
			var types = ['B','A','S'];
			var respawn_time = { B : 30, A : 210, S : 1440 };
			var respawn_max = { B : 60, A : 270, S: 2880 };
			
			for(var idx in types) {
				var tod = this.model.get(types[idx]).tod ? new Date(this.model.get(types[idx]).tod) : false;
				var active = 1;
				var rtime = respawn_time[types[idx]];
				var rtimeMax = respawn_max[types[idx]];
				
				//Differential in minutes between last ToD and now.
				var estimated = 9999;
				var minutesSinceSpawn = Math.floor(this.model.get(types[idx]).tod ? ((new Date() - new Date(this.model.get(types[idx]).tod)) / 1000 / 60): 9999);
				
				//If we're out of our valid range on either side.
				if(minutesSinceSpawn > rtimeMax) {
					active = 0;
					estimated = 9999;
				} else if(minutesSinceSpawn >= rtime && minutesSinceSpawn <= rtimeMax){
					active = 2;
					estimated = 0;
				} else {
					active = 1;
					estimated = minutesSinceSpawn - rtime;
				}
			
				this.model.set(types[idx], {
					tod : tod,
					estimated : estimated,
					active : active
				});
			}
			console.log(this.model.attributes);
    },
    
    render : function(template)
    {
      this.$el.html(template({ zone : this.model.attributes }));
      
    },
  });
  
  
  //----------------------------------------
  //                Models
  //----------------------------------------
  var Zone = this.Zone= Backbone.Model.extend({
    
    idAttribute: "_id",
    initialize : function(attributes, options)
    {
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