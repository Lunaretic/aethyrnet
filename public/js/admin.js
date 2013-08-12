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
      //Retrieve template files.
      getTemplate('dashboard', { view : this }, function(err, context)
      {
      
        this.collection = this.renderCollection = new thisBone.SysUserCollection();
        
        var options = 
        {
          success : function(results, response, options)
          {
            this.render();
          }.bind(this),
          error : function(collection, response, options)
          {
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
    
    renderPage : function()
    {
      this.$el.html(this.template({
        users : this.renderCollection,
        mode : 'full',
      }));
    },
    
    renderList : function()
    {
      this.$el.find('.list-group').html(this.template({
        users : this.renderCollection,
        mode : 'list',
      }));
      return this;
    },
    
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
  //              Users Model
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