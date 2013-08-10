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
      login : {
        "click .submit" : 'attemptLogin',
        "click" : 'frameClick',
        "click .register" : 'attemptRegister',
        'focus input' : 'focusField',
        'blur input' : 'blurField',
        'keyup input': 'keyupField',
      },
      loggedIn : {
        "click" : "profilePage",
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
      
        
      /*this.$el.animateAuto("both",100,function(){
        //Focus username box.
      }.bind(this));*/
      
      this.events = this.modeEvents[this.mode];
      this.delegateEvents();
      
      if(this.mode == 'login')
        $('#loginUsername', this.$el).focus();
    },
    
    
    
    
    //=========================================
    //         User State Management
    //=========================================
    showLogin : function()
    {
      this.render('login');
    },
    
    //Attempt login with server
    attemptLogin : function()
    {
      var username = $('#loginUsername', this.$el).val().toLowerCase().trim();
      var password = $('#loginPassword', this.$el).val().trim();
      
      if(
           username == "username" ||
           username == "" ||
           password == "" ||
           password == "password"
        )
        return this.enableForm("Invalid username/password");
      
      //Remove handlers for now.
      this.undelegateEvents();
      $('.button', this.$el).toggleClass('disabled');
      $('input', this.$el).prop('disabled', true);
      
      var v = this;      
      $.post('/login', {
        username : username,
        password : password,
      }, function(data) {
        //User successfully logged in.
        aethyrnet.util.setupUser(data);
      }, 'json').fail(this.enableForm.bind(this, "Bad Username/Password"));
    },
    
    //Post the registration info.
    attemptRegister : function()
    {
      //Basic form info.
      var username = $('#loginUsername', this.$el).val();
      var password = $('#loginPassword', this.$el).val();
      
      if(
           username == "username" ||
           username == "" ||
           password == "" ||
           password == "password"
        )
        return this.enableForm("Invalid username/password");
      
      //Remove handlers for now while we're working.
      this.undelegateEvents();
      $('.button', this.$el).toggleClass('disabled');
      $('input', this.$el).prop('disabled', true);
      
      //Post (v for scope)
      var v = this;
      $.post('/register', {
        username : username,
        password : password,
      }, function(data) {
      
        //If bad result.
        if(data.result && data.result == "ERROR") 
          return v.enableForm(data.error);
        
        //Welcome user.
        aethyrnet.util.setupUser(data);
      }, 'json').fail(function()
      {
        this.enableForm("There was an error. :(")
      }.bind(this));
    },
    
    enableForm : function(eText)
    { 
      $('.button', this.$el).toggleClass('disabled');
      $('input', this.$el).prop('disabled', false);
      
      if(eText)
      {
        $('.errorText', this.$el).text(eText);
        this.$el.animateAuto("both",100,function(){
        });
      }
      if((!eText) && $('.errorText', this.$el).text() != "")
      {
        $('.errorText', this.$el).text("");
        this.$el.animateAuto("both",100,function(){
        });
      }
      
      this.delegateEvents();
    },
    
    frameClick : function(event)
    {
      if(event.delegateTarget == event.target)
        this.logOut();
    },
    
    
    profilePage : function(event)
    {
      window.location = "/#profile";
    },
    
    logOut : function(event)
    {
      aethyrnet.util.logOut();
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
    
    keyupField : function(event)
    {
      if(event.keyCode == 13) {
        this.attemptLogin();
      }
    }
    
    
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
    return aethyrnet.events.trigger('user:logInOut', true);
  }
};

aethyrnet.util.logOut = function(user)
{
  $.get('/logout');
  
  //Get rid of old user.
  delete aethyrnet.user;
  
  //Set up anonymous user.
  aethyrnet.user = new aethyrnet.backbone['user'].UserModel({
    username : 'anonymous',
  });
  
  return aethyrnet.events.trigger('user:logInOut', false);
};