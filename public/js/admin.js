aethyrnet.backbone['admin'] = new (function(){
  var thisBone = this;
  

  //----------------------------------------
  //            Admin Page
  //----------------------------------------
  this.DashboardView = aethyrnet.PageView.extend({
    
    events : {
      'keyup #username-search' : 'searchUsers',
      'change #username-search' : 'searchUsers',
    },
  
    security : {
      loggedIn : true,
      adminLevel : 3,
    },
    
    initializePage : function(options)
    {
      //TODO: Async.Parallel this later.
      
      //Retrieve template files.
      getTemplate('dashboard', { view : this }, function(err, context)
      {
      
        this.collection = this.renderCollection = new thisBone.SysUserCollection();
        
        //Options for Backbone.Collection.Fetch.
        var options = 
        {
          success : function(results, response, options)
          {
            //Once we have data we're good to render.
            this.render();
          }.bind(this),
          error : function(collection, response, options)
          {
            //For debugging failures currently.
            console.log("Fetch Failed.");
            console.log(collection);
            console.log(response);
            console.log(options);
          },
        };
        
        //Retrevie User List
        this.collection.fetch(options);
      }.bind(this));
    },
    
    //Basic template render, but split into segments.
    renderPage : function()
    {
      this.$el.html(this.template({
        users : this.renderCollection,
        mode : 'full',
      }));
    },
    
    //Render userlist only.
    renderList : function()
    {
      this.$el.find('.list-group').html(this.template({
        users : this.renderCollection,
        mode : 'list',
      }));
      
      //Return this for chaining.
      return this;
    },
    
    //Filters current rendering collection.
    searchUsers : function(event)
    {
      var searchString = $(event.currentTarget).val();
      searchString = searchString || "";
      searchString = searchString.toLowerCase().replace(" ","_");
      this.renderCollection = this.collection.byUsername(searchString);
      
      this.renderList();
    },
    
  });
  
  
  //----------------------------------------
  //         Users Model/Collection
  //----------------------------------------
  this.SysUserModel = Backbone.Model.extend({
    
    idAttribute: "_id",
    url : '/api/users',
    
    initialize : function(attributes, options)
    {
      
    },
  });
  
  this.SysUserCollection = Backbone.Collection.extend({
  
    model : thisBone.SysUserModel,
    url : "/api/users",
    
    //Simple collection-return style filtering.
    byUsername: function(username) 
    {
      filtered = this.filter(function(user) 
      {
        return user.get("username").substring(0, username.length) === username;
      });
      return new thisBone.SysUserCollection(filtered);
    }
    
  });
  
})();