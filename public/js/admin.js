aethyrnet.backbone['admin'] = new (function(){

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
        this.render();
      }.bind(this));
    },
    
  });
})();