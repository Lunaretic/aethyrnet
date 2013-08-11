aethyrnet.backbone['profile'] = new (function(){
  this.ProfileView = aethyrnet.PageView.extend({
        
    events : {
      'click #logoutButton' : 'logOut',
      'click #background-dropdown li' : 'bgChange',
      'click #orientation-dropdown li' : 'orientChange',
      'click #scrolling-dropdown li' : 'scrollChange',
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
      this.$el.find('#orientation-dropdown .value').text($(event.target).text());
      this.saveUser();
    },
    scrollChange : function(event)
    {
      this.$el.find('#scrolling-dropdown .value').text($(event.target).text());
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
      var email = $('#emailField',this.$el).val() || "";
      var charUrl = $('#charUrlField',this.$el).val() || "";
      var sidebarOrientation = $('#orientation-dropdown .value').text();
      sidebarOrientation = sidebarOrientation.toLowerCase();
      var sidebarSticky = ($('#scrolling-dropdown .value').text() == "Fixed Sidebar" ? true : false);
      
      //Background attribute set previously.
      var opts = {
        email : email,
        charUrl : charUrl,
        sidebarOrientation : sidebarOrientation,
        sidebarSticky : sidebarSticky,
      };
      aethyrnet.user.set(opts);
      
      //Backbone smart save.
      aethyrnet.user.save().done(function()
      {
        aethyrnet.notify('Profile updated successfully.', 'success');
                
      }).fail(function(jqXHR, arg2, arg3) 
      {
        //Hard fail. Bad news bears.
        if(jqXHR.status != 400)
          return;
        
        //Bad data.
        for(key in jqXHR.responseJSON.err)
        {
          aethyrnet.error('Profile update failed: ' + key);
        }
      }.bind(this));
    },
    
  });
  
})();