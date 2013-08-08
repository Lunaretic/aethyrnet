aethyrnet.backbone['feed'] = new (function(){
  //----------------------------------------
  //                Models
  //----------------------------------------
  var FeedEntry = this.FeedEntry = Backbone.Model.extend({
    
    idAttribute: "_id",
    url : '/api/user',
    
    initialize : function(attributes, options)
    {
      
    },
    
  });

  //----------------------------------------
  //              Collections
  //----------------------------------------
  var Feed = this.Feed = Backbone.Collection.extend({
    
    model : FeedEntry,
    
    url : "/api/feed",
    
  });

  //----------------------------------------
  //                 Views
  //----------------------------------------
  var FeedEntryView = this.FeedEntryView = Backbone.View.extend({
    
    className : 'feedEntry',
    
    initialize : function()
    {
      this.$el.css({
        opacity : 0,
        'margin-left'  : '10px',
     });
    },
    
    render : function(template)
    {
      //console.log(this.model.attributes());
          
      var content = (this.model.get('content') ? this.model.get('content') : '<a href="' + this.model.get('link') + '">View this post on ' + this.model.get('source') + '</a>');
      
      this.$el.html(template({
        subject :  this.model.get('title'),
        content : content,
        link : this.model.get('link'),
        source : this.model.get('source'),
        date : new Date(this.model.get('date')).toLocaleString(),
        imageSource : '/public/images/' + this.model.get('image'),
        imageLink : ( this.model.get('imageLink') ? this.model.get('imageLink') : this.model.get('link') ),
      }));
      
    },
  });
  
  
  var FeedView = this.FeedView = aethyrnet.PageView.extend({
    
    remove : function()
    {
      delete this.subviews;
    
      //Kill our subviews.
      for(var idx in this.subviews)
        this.subviews[idx].remove();
      
      $.removeData(this.$el);
      
      //Summon base backbone removal.
      Backbone.View.prototype.remove.call(this);
    },
    
    initialize : function(options)
    {
      //Always call base initialize for page views.
      aethyrnet.PageView.prototype.initialize(options);
      
      this.subviews = [];
      this.collection = new Feed();
      
      //Retrieve the feed information from server.
      var v = this;
      async.parallel([

      //Go ahead and retreive the actual feed data from the server.
      function(callback)
      {
        var options = {
          success : function(results, response, options)
          {            
            //Scoping factory to spawn views.
            function tempFact(mdl)
            {
              var fev = new FeedEntryView({
                model : mdl,
              });
              v.subviews.push(fev);
              return fev;
            }
            
            //Create subviews for each model we get from the server.
            for(var idx in results.models)
            {
              var fev = tempFact(results.models[idx]);
            }
            return callback();
          },
          error : function(collection, response, options)
          {
            console.log("Fetch Failed.");
            console.log(collection);
            console.log(response);
            console.log(options);
            return callback();
          },
        };
        v.collection.fetch(options);
      },

      //Retreive our FeedEntry template before calling render.
      function(callback)
      {
        return getTemplate('feedEntry', { css : true,  view : v }, callback);
      }],
      //Ok, now render.
      function(err, result)
      {
        v.render();
      });
      
    },
    
    render : function()
    {
      //Always call base render for main page views.
      aethyrnet.PageView.prototype.render();
      
      this.$el.html('<div class="header">Syndicated News</div>');
      
      for(var idx in this.subviews)
      {
        this.$el.append(this.subviews[idx].el);
        this.subviews[idx].render(this.template);
        this.subviews[idx].$el.delay(idx * 100).animate({
          opacity : 1,
          'margin-left' : 0,
        }, 200);
      }
      
      return this;
    },
    
    events : { 
    },
    
  });
  
  
})();