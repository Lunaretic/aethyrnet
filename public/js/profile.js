aethyrnet.backbone['profile'] = new (function(){
  this.ProfileView = aethyrnet.PageView.extend({
        
    events : {
      'click #logoutButton' : 'logOut',
      'click #saveButton' : 'saveUser',
      'change input[name="background"]' : 'radioChange',
      'focus input[type="text"]' : 'focusField',
      'blur input[type="text"]' : 'blurField',
      'change input[type="text"]' : 'changeField',
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
        background : aethyrnet.user.get('bgImage'),
        email : aethyrnet.user.get('email'),
        charUrl : aethyrnet.user.get('charUrl'),
        avatar : aethyrnet.user.get('avatar'),
        orientation : aethyrnet.user.get('sidebarOrientation'),
        onScreen : aethyrnet.user.get('sidebarSticky'),
      }));
      
      $('input[type="text"]', this.$el).blur();
    },
    
    radioChange : function(event)
    {
      aethyrnet.util.changeBG($(event.target).val());
    },
    
    logOut : function(event)
    {
      aethyrnet.util.logOut();
    },
    
    saveUser : function(event)
    {
      var email = ($('#emailField',this.$el).val() != $('#emailField',this.$el).attr('title') ? $('#emailField',this.$el).val() : '');
      var charUrl = ($('#charUrlField',this.$el).val() != $('#charUrlField',this.$el).attr('title') ? $('#charUrlField',this.$el).val() : '');
      var sidebarOrientation = $('#sidebarOrientation').val();
      var sidebarSticky = ($('#sidebarSticky').val() == "true" ? true : false);
      
      //Background attribute set previously.
      aethyrnet.user.set({
        email : email,
        charUrl : charUrl,
        sidebarOrientation : sidebarOrientation,
        sidebarSticky : sidebarSticky,
      });
      
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
        aethyrnet.error('Profile update failed.');
        for(key in jqXHR.responseJSON.err)
        {
          $('#'+key+'Field', this.$el).addClass('error');
        }
      }.bind(this));
    },
    
    //Generic focus and blur functions for text/password fields.
    focusField : function(event)
    {
      aethyrnet.util.focusField(event);
    },
    
    blurField : function(event)
    {
      aethyrnet.util.blurField(event);
    },
    
    changeField : function(event)
    {
      $(event.target).removeClass('error');
    },
    
  });
  
})();