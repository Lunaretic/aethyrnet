aethyrnet.backbone['admin'] = new (function(){
  var thisBone = this;
  

  //----------------------------------------
  //            Admin Page
  //----------------------------------------
  this.DashboardView = aethyrnet.PageView.extend({
  
    security : {
      loggedIn : true,
      adminLevel : 3,
    },
    
    initializePage : function(options)
    {      
      //Retrieve template files.
      getTemplate('dashboard', { view : this }, function(err, context)
      {
      
        this.collection = new thisBone.SysUserCollection();
        
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
        users : this.collection,
      }));
    }
    
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
    
  });
  
})();