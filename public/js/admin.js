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
    
    events : {
      'click .nav li' : 'navClick',
    },
    
    initializePage : function(options)
    {
      //Retrieve template files.
      getTemplate('dashboard', { css : true, view : this }, function(err, context)
      {
        this.switchView('dashboard/userlist.UserlistPanel');
      }.bind(this));
    },
    
    //Basic template render, but split into segments.
    renderPage : function(viewName)
    {
      console.log("renderPage: " + viewName );
      if(this.$el.html() == "")
      {
        this.$el.html(this.template({
          view : "DashboardView",
          mode : 'full',
        }));
        this.$('.nav li[data-view="'+viewName+'"]').addClass('active');
      }
      
      
      if(this.subview)
      {
        this.$('.loading').remove();
        this.subview.render();
        this.subview.$el.appendTo(this.$("#admin-body"));
      }
    },
    
    renderSubpage : function(subpage, viewName)
    {
      console.log("Subpage render: " + subpage + " - " + viewName );
    },
    
    switchView : function(viewName, opts)
    {
      //Load view.
      var viewString = viewName.split('.');
      var viewSelf = this;
      getBackbone(viewString[0], function switchDashboardView(err, context)
      {
        if(err || !(viewString[1] in context))
          return aethyrnet.error("The requested page does not exist.");
          
        if(this.subview)
          this.subview.remove();
          
        this.$('.nav li.active').removeClass('active');
        this.$('.nav li[data-view="'+viewName+'"]').addClass('active');
          
        
        var loader = $('<img class="loading" src="/public/images/loading.gif"></img>');
        this.$("#admin-body").append(loader);
        
        opts = opts || {};
        opts.callback = this.render.bind(this, {}, viewName);
      
        this.subview = new context[viewString[1]](opts);
      }.bind(this));
    },
    
    navClick : function(event)
    {
      this.switchView($(event.currentTarget).attr('data-view'));
    }
  });
  
})();