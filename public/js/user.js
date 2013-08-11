aethyrnet.backbone['user'] = new (function(){

//=================================================//
//                  User Model
//=================================================//
  this.UserModel = Backbone.Model.extend({
    
    idAttribute : 'username',
    url : "/api/profile",
    
    
    initialize : function(data)
    {
      if(data.username != 'anonymous')
        this.loginStatus = true;
      else
        this.loginStatus = false;
    },
    
    loggedIn : function loggedIn()
    {
      return this.loginStatus
    }
    
  });

//=================================================//
//              Log In Status View
//=================================================//
  this.LoginStatusView = Backbone.View.extend({
    
    id : "loginStatus",
    className : "navbar-text pull-right",
    mode : 'anonymous',
    
    modeEvents :
    {
      anonymous : {
        "click" : "showLogin",
      },
      loggedIn : {
        //"click" : "profilePage",
      },
      register : {
      },
    },
    
    initialize : function(loggedInCallback)
    {
      if(aethyrnet.user.loggedIn())
        this.mode = 'loggedIn';
        
      this.events = this.modeEvents[this.mode];
      this.delegateEvents();
      
      //Bind global events.
      aethyrnet.events.on('user:logInOut', function(loggedIn)
      {
        this.render(loggedIn ? 'loggedIn' : 'anonymous');
      }.bind(this));
      
      
      //Log the user in and get the template for rendering simultaneously.
      async.parallel([
        //Retreive template
        function(callback)
        {
          getTemplate('loginStatus', { css : false, view : this }, callback);
        }.bind(this),
      ],
      function(err, result)
      {
        this.renderOK = true;
        this.render()
      }.bind(this));
      
    },
    
    //=========================================
    //                RENDER
    //=========================================
    render : function(mode)
    {
      if(mode)
        this.mode = mode;
      
      this.$el.attr("class",this.className + " " + this.mode);
      
      //Render variables
      this.$el.html(this.template({
        username : aethyrnet.util.prettyName(aethyrnet.user.get('username')),
        mode : this.mode,
      }));
      
      this.events = this.modeEvents[this.mode];
      this.delegateEvents();
    },
    
    //=========================================
    //         User State Management
    //=========================================
    showLogin : function()
    {
      this.loginModal = new aethyrnet.backbone['user'].LoginModalView();
    },
    
    profilePage : function(event)
    {
      aethyrnet.router.navigate("profile", { trigger : true });
    },
    
    logOut : function(event)
    {
      aethyrnet.util.logOut();
    },
    
  });
  
  this.LoginModalView = Backbone.View.extend({
    id : "login-modal",
    className : "modal fade",
    
    events : {
      "click .login" : 'attemptLogin',
      "click .register" : 'attemptRegister',
      'keyup input': 'keyupField',
    },
    
    initialize : function()
    {
      //Don't allow modal to persist. Get rid of that potentially dangerous user data.
      this.$el.on('hidden.bs.modal', function(){
        this.remove();
      }.bind(this));
    
      //Retreive our shared template, should already be cached.
      getTemplate('loginStatus', { css : false, view : this }, function(err, context)
      {
        this.render();
      }.bind(this));
      
      this.$el.appendTo(document.body);
    },
    
    render : function()
    {
      this.$el.html(this.template({
        mode : 'modal',
      }));
      
      this.$el.modal({
        show : true,
        keyboard : true,
      });
      
      this.$el.delay(200).queue('fx', function(next)
      {
        $('#login-username').focus();
        next();
      });
    },
    
    keyupField : function(event)
    {
      if(event.keyCode == 13) {
        this.attemptLogin();
      }
    },
    
    enableForm : function(eText)
    { 
      $('.button', this.$el).toggleClass('disabled');
      $('input', this.$el).prop('disabled', false);
      
      if(eText)
      {
        this.postError(eText);
      }
      
      this.delegateEvents();
    },
    
    postError : function(eText)
    {
      $(document.createElement('div')).appendTo(this.$el.find('.modal-body')).addClass('alert alert-danger').text(eText).delay(2000).animate({
        opacity : 0
      }, 400).queue('fx', function(next)
      {
        $(this).alert('close');
      });
    },
    
    //Attempt login with server
    attemptLogin : function()
    {
      var username = $('#login-username', this.$el).val().toLowerCase().trim();
      var password = $('#login-password', this.$el).val().trim();
      
      if(
           username == "username" ||
           username == "" ||
           password == "" ||
           password == "Password"
        )
        return this.enableForm("Invalid username/password");
      
      //Remove handlers for now.
      this.undelegateEvents();
      $('.btn', this.$el).toggleClass('disabled');
      $('input', this.$el).prop('disabled', true);
      
      $.post('/api/login', {
        username : username,
        password : password,
      }, function(data) {
        this.$el.modal('hide')
        //User successfully logged in.
        aethyrnet.util.setupUser(data);
      }.bind(this), 'json').fail(this.enableForm.bind(this, "Bad Username/Password"));
    },
    
    //Post the registration info.
    attemptRegister : function()
    {
      var username = $('#login-username', this.$el).val().toLowerCase().trim();
      var password = $('#login-password', this.$el).val().trim();
      
      if(
           username == "username" ||
           username == "" ||
           password == "" ||
           password == "Password"
        )
        return this.enableForm("Invalid username/password");
      
      //Remove handlers for now while we're working.
      this.undelegateEvents();
      $('.btn', this.$el).toggleClass('disabled');
      $('input', this.$el).prop('disabled', true);
      
      $.post('/api/register', {
        username : username,
        password : password,
      }, function(data) {
      
        //If bad result.
        if(data.result && data.result == "ERROR") 
          return this.enableForm(data.error);
        
        //Welcome user.
        aethyrnet.util.setupUser(data);
        this.$el.modal('hide')
      }.bind(this), 'json').fail(function()
      {
        this.enableForm("There was an error. :(")
      }.bind(this));
    },
  });
})();


aethyrnet.util.showUserBg = function()
{
  var userBg = 'coerthas';
  if(aethyrnet.user.loggedIn())
    userBg = (aethyrnet.user.get('bgImage') ? aethyrnet.user.get('bgImage') : 'gridania');
    
  aethyrnet.util.changeBG(userBg);
}

aethyrnet.util.changeBG = function(bgImage)
{
  //Fade out old BG if there is one.
  if($('#background').css('background-image') != 'none')
  {
    $('#background').animate({
      opacity : 0,
    }, 100)
  }
  else
  {
    $('#background').css({ opacity : 0});
  }
  
  aethyrnet.user.set('bgImage', bgImage);
  
  
  //Load new BG on a delay.
  $('#background').queue(function(next)
  {
    $('#background').css( { 'background-image' : 'url("/public/images/' + bgImage + '.jpg")'});
    //Delay a bit while user downloads image.
    $('#background').delay(100);
    $('#background').animate({
      opacity : 1,
    }, 200);
    next();
  });
};

aethyrnet.util.setupUser = function(user)
{
  if(!user)
  {
    return aethyrnet.util.logOut();
  }
  else
  {
    //Bind our data
    aethyrnet.user = new aethyrnet.backbone['user'].UserModel(user);
    if(aethyrnet.notify)
      aethyrnet.notify("Now logged in as <strong>" + aethyrnet.util.prettyName(user.username) + "</strong>", 'success');
    return aethyrnet.events.trigger('user:logInOut', true);
  }
};

aethyrnet.util.logOut = function(user)
{
  $.get('/api/logout');
  
  //Get rid of old user.
  delete aethyrnet.user;
  
  //Set up anonymous user.
  aethyrnet.user = new aethyrnet.backbone['user'].UserModel({
    username : 'anonymous',
  });
  
  aethyrnet.notify("You have been successfully logged out.");
  return aethyrnet.events.trigger('user:logInOut', false);
};