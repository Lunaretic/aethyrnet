aethyrnet.backbone['profile'] = new (function(){
  this.ProfileView = aethyrnet.PageView.extend({
    
    id : 'profile',
    
    events : {
      'click #logoutButton' : 'logOut',
      'click #saveButton' : 'saveUser',
      'change input[name="background"]' : 'radioChange',
      'focus input[type="text"]' : 'focusField',
      'blur input[type="text"]' : 'blurField',
      'change input[type="text"]' : 'changeField',
    },
        
    initialize : function(options)
    {
      //Set up Security options
      options.security = {
        loggedIn : true,
      };
      
      //Boilerplate
      aethyrnet.PageView.prototype.initialize(options)
        
      getTemplate('profile', { css : true, view : this, mainCss : true }, this.render.bind(this));
    },
    
    render : function()
    {
      aethyrnet.PageView.prototype.render();
      this.$el.html(this.template({
        //Template vars
        username : aethyrnet.util.prettyName(aethyrnet.user.get('username')),
        background : aethyrnet.user.get('bgImage'),
        email : aethyrnet.user.get('email'),
        charUrl : aethyrnet.user.get('charUrl'),
        avatar : aethyrnet.user.get('avatar'),
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
      aethyrnet.user.set({
        email : email,
        charUrl : charUrl,
      });
      aethyrnet.user.save().done(function()
      {
        aethyrnet.notify('Profile updated successfully.');
        
        //Pointless since new user data isn't retreived from server yet.
        //TODO: Set up a refreshUser() function?
        //aethyrnet.viewport.reload();
        
      }).fail(function(jqXHR, arg2, arg3) 
      {
        //Hard fail. Bad news bears.
        if(jqXHR.status != 400)
          return;
        
        //Bad data.
        aethyrnet.notify('Profile update failed.');
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