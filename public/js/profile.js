aethyrnet.backbone['profile'] = new (function(){
  this.ProfileView = aethyrnet.PageView.extend({
        
    events : {
      'click #logoutButton' : 'logOut',
      'click #bgImage-input li' : 'bgChange',
      'click #sidebarOrientation-input li' : 'orientChange',
      'click #sidebarSticky-input li' : 'scrollChange',
      'change input' : 'inputChange',
    },
    
    security : {
      loggedIn : true,
    },
        
    initializePage : function()
    {
      //Set up Security options
      security = {
        loggedIn : true,
      };
      getTemplate('profile', { css : true, view : this, mainCss : true }, function()
      {
        //Refresh the user data.
        aethyrnet.user.fetch({
          success : function(mdl, res, err)
          {
            this.render();
          }.bind(this),
          error : function(mdl, res, err)
          {
            this.render();
          }.bind(this),
        });
      }.bind(this));
    },
    
    renderPage : function()
    {
      this.$el.html(this.template({
        //Template vars
        username : aethyrnet.util.prettyName(aethyrnet.user.get('username')),
        background : aethyrnet.util.prettyName(aethyrnet.user.get('bgImage')),
        email : aethyrnet.user.get('email'),
        charUrl : aethyrnet.user.get('charUrl'),
        charName : aethyrnet.user.get('charName'),
        avatar : aethyrnet.user.get('avatar'),
        orientation : aethyrnet.util.prettyName(aethyrnet.user.get('sidebarOrientation')),
        onScreen : aethyrnet.user.get('sidebarSticky'),
        preferredActivity : aethyrnet.user.get('preferredActivity'),
        primaryJob : aethyrnet.user.get('primaryJob'),
        secondaryJob : aethyrnet.user.get('secondaryJob'),
      }));
      
      $('input[type="text"]', this.$el).blur();
    },
    
    bgChange : function(event)
    {
      this.$el.find('#bgImage-input .value').html($(event.target).text());
      this.saveUser();
      
      //TODO: Change to use model change event.
      aethyrnet.util.changeBG($(event.target).text().toLowerCase().replace(" ","_").replace(/[^_a-z]/, ''));
    },
    
    orientChange : function(event)
    {
      this.$el.find('#sidebarOrientation-input .value').text($(event.target).text());
      this.saveUser();
    },
    scrollChange : function(event)
    {
      this.$el.find('#sidebarSticky-input .value').text($(event.target).text());
      this.saveUser();
    },
    
    inputChange : function(event)
    {
      this.saveUser();
    },
    
    logOut : function(event)
    {
      aethyrnet.util.logOut();
    },
    
    saveUser : function()
    {
      var email = $('#email-input',this.$el).val() || "";
      var charUrl = $('#charUrl-input',this.$el).val() || "";
      var charName = $('#charName-input',this.$el).val() || "";
      var sidebarOrientation = $('#sidebarOrientation-input .value').text().toLowerCase();
      var sidebarSticky = ($('#sidebarSticky-input .value').text() == "Fixed Sidebar" ? true : false);
      var bgImage = $('#bgImage-input .value').text().toLowerCase().replace(" ","_").replace(/[^_a-z]/, '');
      
      //Background attribute set previously.
      var opts = {
        email : email,
        charName : charName,
        charUrl : charUrl,
        sidebarOrientation : sidebarOrientation,
        sidebarSticky : sidebarSticky,
        bgImage : bgImage,
      };
      
      var changed = {};
      for(var idx in opts)
      {
        if(opts[idx] != aethyrnet.user.get(idx))
        {
          changed[idx] = opts[idx];
          this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-retweet');
        }
      };
      
      
      //Save OK.
      this.$('.has-error').removeClass('has-error');
      this.$('.has-success').removeClass('has-success');
      
      
      //Backbone smart save.
      aethyrnet.user.save(changed, {patch: true}).done(function()
      {
        
        for(idx in changed)
        {
          this.$('#'+idx+'-input').parent().addClass('has-success').delay(1500).queue('fx', function(next)
          {
            $(this).removeClass('has-success');
            return next();
          });
          this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-ok');
        }
        
      }.bind(this)).fail(function(jqXHR, arg2, arg3) 
      {
        //Hard fail. Bad news bears.
        if(jqXHR.status != 400)
          return;
        
        //Bad data.
        for(idx in changed)
        {
          if(idx in jqXHR.responseJSON.err)
          {
            this.$('#'+idx+'-input').parent().addClass('has-error').delay(1500).queue('fx', function(next)
            {
              $(this).removeClass('has-error');
              return next();
            });
            this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-remove');
          }
          else
          {
          this.$('#'+idx+'-input').parent().addClass('has-success').delay(1500).queue('fx', function(next)
          {
            $(this).removeClass('has-success');
            return next();
          });
          this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-ok');
          }
        }
      }.bind(this));
    },
    
  });
  
})();