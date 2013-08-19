aethyrnet.backbone['profile'] = new (function(){
  this.ProfileView = aethyrnet.PageView.extend({
        
    events : {
      'click #logoutButton' : 'logOut',
      'click #background-dropdown li' : 'bgChange',
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
      
      getTemplate('profile', { css : true, view : this, mainCss : true }, this.render.bind(this));
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
      }));
      
      $('input[type="text"]', this.$el).blur();
    },
    
    bgChange : function(event)
    {
      this.$el.find('#background-dropdown button').html($(event.target).text() + ' <span class="caret">');
      aethyrnet.util.changeBG($(event.target).text().toLowerCase().replace(" ","_").replace(/[^_a-z]/, ''));
      
      this.saveUser();
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
      var sidebarOrientation = $('#sidebarOrientation-input .value').text();
      sidebarOrientation = sidebarOrientation.toLowerCase();
      var sidebarSticky = ($('#sidebarSticky-input .value').text() == "Fixed Sidebar" ? true : false);
      
      //Background attribute set previously.
      var opts = {
        email : email,
        charName : charName,
        charUrl : charUrl,
        sidebarOrientation : sidebarOrientation,
        sidebarSticky : sidebarSticky,
      };
      
      var changed = {};
      for(var idx in opts)
      {
        if(opts[idx] != aethyrnet.user.get(idx))
        {
          changed[idx] = opts[idx];
        }
      };
      
      
      aethyrnet.user.set(changed);
      
      //Backbone smart save.
      aethyrnet.user.save().done(function()
      {
        //Save OK.
        this.$('.has-error').removeClass('has-error');
        
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
            this.$('#'+idx+'-input').parent().addClass('has-error');
          else
            this.$('#'+idx+'-input').parent().addClass('has-success').delay(1500).queue('fx', function(next)
            {
              $(this).removeClass('has-success');
              return next();
            });
        }
      }.bind(this));
    },
    
  });
  
})();