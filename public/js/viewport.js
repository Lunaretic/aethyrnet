//====================================================//
//  Viewport.js - The main viewport frame and other
//    necessities for running the Aethyrnet app.
//
//   - Viewport view
//   - Main Menu view
//   - Router Singleton.
//   - Accessory/utility functions
//


//====================================================//
//                     Viewport
//====================================================//
aethyrnet.backbone['viewport'] = new (function(){
  this.ViewportView = Backbone.View.extend({
  
    subviews : {},
    mainView : false,
    
    renderOK : false,
    
    events : {
      'click #logo' : 'goHome',
    },
    
    initialize : function(options)
    {
      //Will handle its own rendering
      this.subviews.loginStatusPanel = new aethyrnet.backbone['user'].LoginStatusView();
      this.subviews.loginStatusPanel.$el.appendTo($('#header'));
        
      //OK to render now.
      this.renderOK = true;
    
      //Call render.
      this.render();
      
      //Create Main Menu.
      this.subviews.mainMenu = new aethyrnet.backbone['viewport'].MainMenuView({ el : $('#menu') });
      this.subviews.statusPanel = new aethyrnet.backbone['viewport'].StatusView({ el : $('#statusPanel') });
    },
    
    // Ease of access function for reloading current page.
    reload : function()
    {
      this.render(this.currentPage, true);
    },
    
    
    /* ===============================================
                  Main Page Rendering
    =============================================== */
    render : function(page, noHistory)
    {
      viewString = aethyrnet.viewMap[page];
      
      //Nothing to do here if we're not ready to render & have no string. (Should never happen)
      if(!this.renderOK && !viewString)
        return;
      
      //If we're not ready to render.
      if((!this.renderOK) || this.rendering) 
      {
        //Save the view for later.
        aethyrnet.pageQueue = viewString
        return;
      }
      
      //Bind to our queue'd view if we don't have one yet.
      if(!viewString)
      {
        if(!aethyrnet.pageQueue)
          return false;
        
        page = aethyrnet.pageQueue;
        viewString = aethyrnet.viewMap[page];
        aethyrnet.pageQueue = false;  
      }
      
      this.rendering = true;
      this.currentPage = page;
      
      //Slice up our view string.
      var view = viewString.split('.');
      
      //Hide old page.
      $("#main").animate({
        opacity : 0.0,
      },{
        duration : 100,
        easing : 'easeInQuad',
      });
      
      //Add removal of old view to queue.
      if(this.mainView)
      {
        var mv = this.mainView;
        $('#main').queue('fx', function(next)
        {
          mv.remove();
          delete mv;
          
          //Remove old CSS if it exists
          $('#mainCSS').remove();
          next();
        });
      }
      
      
      
      //Show loading icon.
      $('#loading').css({
        visibility : 'visible',
      }).animate({
        opacity : 1.0,
      },{
        duration : 100,
        easing : 'easeInQuad',
      });
      
      aethyrnet.router.navigate(page, {
        replace : noHistory
      });
      
      window.document.title = "Aethyrnet - " + aethyrnet.util.prettyName(page);
      
      //Ensure our feed backbone is loaded and display main feed.
      getBackbone(view[0], (function renderMainView(err, context)
      {
        //Setup render callback.
        var renderCallback = function(){
        
          //Hide loading icon.
          $('#loading').clearQueue('fx').animate({
            opacity : 0,
          },{
            duration : 100,
            easing : 'easeInQuad',
          }).queue('fx', function(next)
          {
            $('#loading').css({
              visibility : 'hidden',
            });
            next();
          });
          
          //Display main page view.
          $("#main").animate({
            opacity : 1.0,
          },{
            duration : 100,
            easing : 'easeInQuad',
          });
        };
          
          
        //Attempt to instantiate view.
        try 
        {
          this.mainView = new context[view[1]]({ renderCallback : renderCallback });
        }
        //Because Chrome is too retarded to support if e instanceof aethyrnet.SecurityError
        catch(e)
        {
          //We only want our security errors and nothing else.
          if(!(e instanceof aethyrnet.SecurityError))
            throw e;
            
          this.mainView = new aethyrnet.backbone['viewport'].securityErrorView({
            renderCallback : renderCallback,
            error : e
          });
        }
        
        
        this.mainView.$el.appendTo($("#main"));
        
        this.rendering = false;
      }).bind(this));
    },
    
    //Viewport secondary functions
    goHome : function(event)
    {
      this.render('news');
    }
  });
  
//==============================================//
//              Main Menu View
//==============================================//
  // Main navigation menu view
  this.MainMenuView = Backbone.View.extend({
    
    events : {
      'click span' : 'menuClick',
    },
    
    items : {
      'News' : 'news',
      
      'Profile' : {
        'page' : 'profile',
        'loggedIn' : true,
      },
      
      'About' : 'about',
      
      'Lodestone' : 'url:http://na.beta.finalfantasyxiv.com/lodestone/',
    },
    
    initialize : function()
    {
      getTemplate('menu', { view : this }, this.render.bind(this));
    },
    
    render : function()
    {
      var items = {};
      for(var idx in this.items)
      {
        //Always show basic links.
        if(typeof(this.items[idx]) == 'string')
          items[idx] = this.items[idx];
        else
        {
          //Ensure login requirement for log-in required items.
          if(this.items[idx].loggedIn && aethyrnet.user.loggedIn())
            items[idx] = this.items[idx];
        }
      }
      
      this.$el.html(this.template({
        //Template vars
        items : items
      }));
    },
    
    menuClick : function(event)
    {
      var page = this.items[$(event.target).text()];
      if(typeof(page) != 'string')
        page = page.page;
    
      if(page.substring(0,4) == 'url:')
        return window.location = page.substring(4);
      return aethyrnet.viewport.render(page)
    }
    
  });
  
  // Status notification view.
  this.StatusView = Backbone.View.extend({
    
    initialize : function()
    {
      aethyrnet.notify = this.post.bind(this);
    },
    
    render : function()
    {
    },
    
    post : function(message, type)
    {
      //First, change our displayed text.
      this.$el.queue('fx',function(next){
        this.$el.text(message);
        this.$el.addClass(type);
        next();
      }.bind(this)).animate({
        //Then animate us visible
        top : 0,
        
      }, 300).delay(2000).animate({
        //Then delay, then animate us back out.
        top : -50,
        
      }, 300).queue('fx', function(next){
        //Now remove error text and class.
        this.$el.text("");
        this.$el.removeClass(type);
        next();
      }.bind(this));
    },
    
    clear : function()
    {
    }
    
  });
  
    
  //===========================================//
  //        Base Boilerplate Page View
  //===========================================//
  this.PageView = Backbone.View.extend({
    initialize : function(options)
    {
      var options = options || {};
      var security  = this.security || options.security || {};
      
      //Client-side security checking.
      if(security.loggedIn && !aethyrnet.user.loggedIn())
      {
        //If we failed security, throw us out of here.
        throw new aethyrnet.SecurityError("You must be logged in to access this page.");
      }
        
     
      this.renderCallback = options.renderCallback;
      return true;
    },
    render : function()
    {
      if(this.renderCallback)
      {
        this.renderCallback();
        delete this.renderCallback;
      }
    }
  });
  
  //===========================================//
  //           Security Error View
  //===========================================//
  this.SecurityErrorView = this.PageView.extend({
    //Created by viewport.render()
    initialize : function(options)
    {
      //Boilerplate
      aethyrnet.PageView.prototype.initialize(options);
      this.error = options.error;
      
      this.render();
    },
    
    render : function()
    {
      this.$el.text(this.error);
    
      //Boilerplate
      aethyrnet.PageView.prototype.render();
    },
  });
})();


//====================================================//
//                     Router
//====================================================//

//Main map from client-safe pageNames to viewStrings.
aethyrnet.viewMap = {
  'news' : 'feed.FeedView',
  'profile' : 'profile.ProfileView',
  'about' : 'about.AboutView',
  'recruitment' : 'about.RecruitmentView',
};

aethyrnet.router = new (Backbone.Router.extend({
  routes : {
    //Ghetto router mode, go!
    '' : 'standardPage',
    ':page' : 'standardPage',
  },
  
  //Basic translation from client pages to viewStrings.
  standardPage : function(page)
  {    
    var firstPage = false;
    if(!page)
    {
      //Default Page
      page = 'news';
      firstPage = true;
    }
    
    viewString = aethyrnet.viewMap[page];
    
    if(!viewString)
      return console.log("Unknown page requested: " + page);
    
    
    if(aethyrnet.viewport)
      aethyrnet.viewport.render(page, firstPage);
    else
    {
      //Optimization: Go ahead and retreive the backbone for the cache while we wait.
      aethyrnet.pageQueue = page;
      
      var bone = viewString.split('.')[0]
      if(bone)
        getBackbone(bone);
    }
    
    //Don't do shit, cap'n!
  },
}))();
aethyrnet.PageView = aethyrnet.backbone['viewport'].PageView;

Backbone.history.start();

//====================================================//
//                  Util Functions
//====================================================//
function getBackbone(file, exec, callback){
  if(!callback)
  {
    callback = exec;
    exec = null;
  }

  async.waterfall([
    function(callback)
    {
      //Return the context from the previously executed file.
      if(aethyrnet.backbone[file])
      {
        return callback(null, aethyrnet.backbone[file]);
      }
      
      //Or load file from server if we haven't seen it yet.
      else
      {
        $.getScript( '/public/js/' + file + '.js', function(data)
        {
          //Script should evaluate and add itself into the aethyrnet.
          return callback(null, aethyrnet.backbone[file]);
        });
      }
    },
    function(file, callback)
    {
      return callback(null, file);
    },
  ],
  function(err, context)
  {
    if(err)
    {
      console.log("Error during evaluation of script:" + file);
      console.log(err);
      return callback(err, context);
    }
    
    //Call function in new context if we have one.
    if(exec)
    {
      return exec.call(context, callback);
    }
    
    //Return our context out of getBackbone
    if(callback)
      return callback(err, context);
    return;
  });
}

//Template retreival function to prevent multi-loading template files.
function getTemplate(file, options, callback)
{
  if(!callback)
  {
    callback = options;
    options = {};
  }
  
  //Force file to lowercase.
  file = file.toLowerCase();
  
  //Default options.
  options.css = ( options.css === undefined ? false : options.css );
  options.template = ( options.template === undefined ? true : options.template );
  
  
  if(
    ( (!options.template) || aethyrnet.template[file] ) &&
    ( (!options.css) || aethyrnet.css[file] )
  )
  {
    if(options.view)
      options.view.template = aethyrnet.template[file];
    return callback(null, aethyrnet.template[file]);
  }
  else
  {
    async.parallel([
      function(callback)
      {
        if(!options.template)
          return callback(false);
          
        $.get('/public/templates/' + file + '.html', function(data, status, jqXHR)
        {
          if(status != 'success')
          {
            console.log("Failed to retreive template: " + file);
            return callback(status);
          }
          
          data = _.template(data);
          
          if(options.view)
            options.view.template = data;
          
          aethyrnet.template[file] = data;
          
          return callback(null, data);
        }).fail(function()
        {
          console.log("Failed to retreive template: " + file);
          return callback(true);
        });
      },
      function(callback)
      {
        if(!options.css)
          return callback(false);
        
        //Strip old core CSS if it exists.
        if(options.mainCSS)
          $('#mainCSS').remove();
          
        
        $.get('/public/css/' + file + '.css',function(data, status, jqXHR)
        {
          
          var e = $(document.createElement('style')).addClass('css_' + file).appendTo("head").html(data);
          if(options.mainCSS)
            e.attr('id','mainCSS');
            
          //Safety precaution for memory leaks
          e = null;
          
          return callback(false);
        }).fail(function()
        {
          console.log("Failed to retreive CSS: " + file);
          return callback(true);
        });
      },
    ],
    function(err, result)
    {
      return callback(err, result[0]);
    });
  }
}


//JQuery auto size extension
jQuery.fn.animateAuto = function(prop, speed, callback){
    var elem, height, width;
    return this.each(function(i, el){
        el = jQuery(el), elem = el.clone().css({"height":"auto","width":"auto"}).appendTo("body");
        height = elem.css("height"),
        width = elem.css("width"),
        elem.remove();
        
        if(prop === "height")
            el.animate({"height":height}, speed, callback);
        else if(prop === "width")
            el.animate({"width":width}, speed, callback);  
        else if(prop === "both")
            el.animate({"width":width,"height":height}, speed, callback);
    });  
}

//Pretty Print Names
aethyrnet.util.prettyName = function(username)
{
  //Capitalize first letter
  return username.charAt(0).toUpperCase() + username.slice(1);
}


//Generic focus and blur functions for text/password fields.
aethyrnet.util.focusField = function(event)
{
  var elem = $(event.target);
  
  elem.removeClass("inactive");

  if(elem.prop('title') == 'password')
    elem.prop('type','password');
  
  if(elem.val() == elem.prop('title'))
    elem.val("");
};

aethyrnet.util.blurField = function(event)
{
  var elem = $(event.target);
  
  if(elem.val() == "")
  {
    elem.val(elem.prop('title'));
    
    
    if(elem.prop('title') == 'password')
      elem.prop('type','text');
    
    elem.addClass("inactive");
  }
};


//=============================================//
//                Error Objects
//=============================================//
aethyrnet.SecurityError = function SecurityError(msg){
  this.msg = msg;
  this.toString = function(){
    return this.msg;
  };
};
