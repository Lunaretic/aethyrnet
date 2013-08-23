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
        this.switchView('UserlistPanel');
      }.bind(this));
    },
    
    //Basic template render, but split into segments.
    renderPage : function(viewName)
    {
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
    
    switchView : function(viewName, opts)
    {
      if(!thisBone[viewName])
        return aethyrnet.error("The requested page does not exist.");
    
      if(this.subview)
        this.subview.remove();
        
      this.$('.nav li.active').removeClass('active');
      this.$('.nav li[data-view="'+viewName+'"]').addClass('active');
        
      
      var loader = $('<img class="loading" src="/public/images/loading.gif"></img>');
      this.$("#admin-body").append(loader);
      
      opts = opts || {};
      opts.callback = this.render.bind(this, viewName);
      this.subview = new thisBone[viewName](opts);
    },
    
    navClick : function(event)
    {
      this.switchView($(event.currentTarget).attr('data-view'));
    }
  });
  
  //----------------------------------------
  //       Userlist Panel
  //----------------------------------------
  this.UserlistPanel = Backbone.View.extend({
    id : "admin-panel",
    className : "container panel panel-default",
    
    events : {
      'keyup #username-search' : 'searchUsers',
      'change #username-search' : 'searchUsers',
      'click a' : 'selectUser',
    },
  
  
    initialize : function(options)
    {
      //Retrieve template files - Should be coming straight out of cache, so nbd.
      getTemplate('dashboard', { view : this }, function(err, context)
      {
        this.collection = this.renderCollection = new thisBone.SysUserCollection();
        
        
        //Retrevie User List
        this.collection.fetch({
          success : function()
          {
            return options.callback();
          },
          error : function()
          {
            return options.callback();
          },
        });
      }.bind(this));
      
    },
    
    //Basic template render, but split into segments.
    render : function()
    {
      this.$el.html(this.template({
        view : "UserlistPanel",
        users : this.renderCollection,
        mode : 'full',
      }));
    
      
      //Focus us once everything is said and done.
      this.listenToOnce(aethyrnet.events, 'page-frame:renderComplete', function()
      {
        this.$('#username-search').focus();
      }.bind(this));
    },
    
    //Render userlist only.
    renderList : function()
    {
      this.$('.list-group').html(this.template({
        view : "UserlistPanel",
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
    
    selectUser : function(event)
    {
      var username = $(event.currentTarget).text();
      aethyrnet.viewport.mainView.switchView('UserAdminPanel', {
        model : this.collection.findWhere({
          _id : $(event.currentTarget).attr('data-id'),
        }),
      });
    },
  });
  
  
  
  //----------------------------------------
  //           UserAdmin Panel
  //----------------------------------------
  this.UserAdminPanel = Backbone.View.extend({
    id : "admin-panel",
    className : "container panel panel-default",
    
    events : {
      'change input' : 'updateServer',
    },
    
    initialize : function(options)
    {
      async.parallel([
        getTemplate.bind(this, 'dashboard/userAdmin', { view : this }),
        function(callback){
          this.model.fetch().always(function(jqXHR, textStatus, errorThrown)
          {
            //Pass error through if we have one.
            callback((errorThrown === jqXHR ? errorThrown : null));
          })
        }.bind(this),
      ], function(err, results)
      {
        return options.callback();
      });
    },
    
    render : function()
    {
      var renderData = this.model.omit('id');
    
      this.$el.html(this.template({
        model : renderData,
      }));
    },
    
    updateServer : function(event)
    {
      var $this = $(event.currentTarget);
      
      //The field & data to send to server.
      var data = {};
      var fieldName = ($this.attr('id').slice(0,-6));
      data[fieldName] = $this.val();
      data._id = this.model.get('_id');
      
      //Set up for save.
      $this.removeClass('has-error').removeClass('has-success');
      
      //Backbone smart save/patch.
      this.model.save(data, {patch: true}).done(function()
      {
        $this.parent().addClass('has-success').delay(1500).queue('fx', function(next)
        {
          $(this).removeClass('has-success');
          return next();
        });
        $this.parent().find('.status').attr('class', 'status glyphicon glyphicon-ok');
        
      }).fail(function(jqXHR, textStatus, errorThrown) 
      {
        //Hard fail. Bad news bears.
        if(jqXHR.status != 400)
        {
          console.log("Hard Failure on jqXHR Request.");
          console.log(JSON.stringify(jqXHR) + " ||" + textStatus + " || " + errorThrown);
          return;
        }
        
        //Bad data.
        $this.parent().addClass('has-error').delay(1500).queue('fx', function(next)
        {
          $(this).removeClass('has-error');
          return next();
        });
        $this.parent().find('.status').attr('class', 'status glyphicon glyphicon-remove');
      }.bind(this));
    }
    
    
    
  });
  
  //----------------------------------------
  //         Users Model/Collection
  //----------------------------------------
  this.SysUserModel = Backbone.Model.extend({
    
    idAttribute: "_id",
    urlRoot : '/api/profile',
    
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