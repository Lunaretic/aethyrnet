//====================================================//
//  Viewport.js - The main viewport frame and other
//    necessities for running the Aethyrnet app.
//
//   - Viewport view
//   - Main Menu view
//   - Router Singleton
//   - Base PageView class
//   - Accessory/utility functions
//


//====================================================//
//                     Viewport
//====================================================//
aethyrnet.backbone['viewport'] = new (function(){
  this.ViewportView = Backbone.View.extend({
    
    events : {
      'click #header .navbar-brand' : 'goHome',
      "click a[href^='/']" : 'navigateLink',
    },
    
    initialize : function(options)
    {
      aethyrnet.viewport = this;
      
      this.subviews = {};
      this.mainView = false;
      this.renderOK = false;

      //Attach the login status panel.
      this.subviews.loginStatusPanel = new aethyrnet.backbone['user'].LoginStatusView(
      {
        el : $('#login-status')
      });
      
      //Attach alert panel.
      this.subviews.alertPanel = new aethyrnet.backbone['viewport'].AlertView(
      {
        el : $('#alert-panel')
      });
      
      //Create Main Menu.
      this.subviews.mainMenu = new aethyrnet.backbone['viewport'].MainMenuView(
      { 
        el : $('#main-menu') 
      });      
      
      //OK to render now.
      this.renderOK = true;
      
      //Call render.
      this.render();
      
      
      //Hook our other events we want.
      aethyrnet.events.on('user:logInOut', function(loggedIn)
      {
        if(loggedIn)
          this.reload();
        else
          aethyrnet.router.navigate('', { trigger : true });
          
        aethyrnet.util.showUserBg();
      }.bind(this));
    },
    
    // Ease of access function for reloading current page.
    reload : function()
    {
      this.render(this.currentPage, true, true);
    },
    
    navigateLink : function(event)
    {
      // Allow shift+click for new tabs, etc.
      if(!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey)
        event.preventDefault()
        
      var $ct = $(event.currentTarget);
      
      aethyrnet.router.navigate($ct.attr('href').substring(1), {
        trigger : true,
      });
    },
    
    
    
    /* ===============================================
                  Main Page Rendering
    =============================================== */
    render : function(page, noHistory, forceRecreate)
    {
      page = page || '';
      
      if(page[page.length - 1] == '/')
        page = page.slice(0, -1);
      
      var viewString = aethyrnet.viewMap[page.split('/')[0]];
      
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
        viewString = aethyrnet.viewMap[page.split('/')[0]];
        aethyrnet.pageQueue = false;  
      }
      
      this.rendering = true;
      
      var sameRoot = false;
      
      //If we're re-rendering from the same base view.
      if(this.currentPage && this.mainView &&  this.currentPage.split('/')[0] == page.split('/')[0] && !forceRecreate)
        sameRoot = true;
      
      //Our current view must also be capable of rendering special routes to allow root routing.
      if(sameRoot && !('renderSubpage' in this.mainView))
        sameRoot = false;
        
        
      
      this.currentPage = page;
      
      var subpage = (page.indexOf('/') === -1 ? '' : page.substring(page.indexOf('/')));
      
      aethyrnet.events.trigger('page-frame:unload');
      
      //Display the loading bar.
      this.startStatusBar();
      
      //Slice up our view string.
      var view = viewString.split('.');
      
      //Hide old page.
      $("#main").animate({
        opacity : 0.0,
      },{
        duration : 100,
        easing : 'easeInQuad',
      });
      
      //Add removal of old view to queue, if we are not re-using it.
      if(this.mainView && !sameRoot)
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
      
      //Update the user's browser history to reflect the new page.
      aethyrnet.router.navigate(page, {
        replace : noHistory
      });
      
      //Just use a slightly prettied up version of our page URL for now.
      window.document.title = "Aethyrnet - " + aethyrnet.util.prettyName(page);
      
      //Update progress (30% - Ready to load backbone view from server)
      this.updateStatusBar(30);
      
      if(!sameRoot)
      {
        //Need to get backbone from server if it's a new page.
        getBackbone(view[0], function(err, context)
        {
        
          //Blow up on error for now.
          if(err)
            throw(err);
          
          //Queue onto #main to prevent DOM collisions.
          $('#main').queue('fx', function(next)
          {
            //Attempt to instantiate view.
            try
            {
              //basically just - aethyrnet.backbone.viewFile.viewName(opts).
              this.mainView = new context[view[1]]({
                subpage : subpage
              });
            }
            //Keep an eye out for failed view creation.
            catch(e)
            {
              //Because Chrome is too retarded to support if e instanceof aethyrnet.SecurityError in the catch
              if(!(e instanceof aethyrnet.SecurityError))
                throw e;
              
              //Kill the main view.
              this.mainView = false;
              aethyrnet.error(e);
              
              //Done rendering.
              this.hideStatusBar(false);
              aethyrnet.events.trigger('viewport:renderComplete');
              return next();
            }
            return next();
          }.bind(this));
        }.bind(this));
      }
      //For rendering new sub-pages on the same root.
      else
      {
        this.mainView.render({
          subpage : subpage,
        });
      }
      
      
      //Queue us onto #main's queue to prevent DOM collisions
      //If needed, the swap out for the mainView is queued on 'fx'.
      $('#main').queue('fx', function(next)
      {
        this.updateStatusBar(70);
      
        //Bind the render callback to the main event listener.
        aethyrnet.events.once('page-frame:render', this.renderCallback);
        
        this.rendering = false;
        next();
      }.bind(this));
    },
        
    //A function that handles the fade-in of #main.
    //Called via a one-time listen to page-frame:render on the main
    //aethyrnet.events object.
    renderCallback : function()
    {
      aethyrnet.viewport.hideStatusBar(true);
      
      //Display main page view.
      $('#main').queue('fx', function(next)
      {
        //Attach us to the main viewport area and display.
        if(aethyrnet.viewport.mainView.$el.parent().attr('id') != '#main');
          aethyrnet.viewport.mainView.$el.appendTo('#main');
        
        $(this).css({
          opacity: 1
        });
        return next();
      });
    },
    
    //Viewport secondary functions
    goHome : function(event)
    {
      this.render('news');
    },
    
    startStatusBar : function(type)
    {
      type = type | "";
      var statusBar = $(document.createElement('div')).addClass('progress-bar ' + type).appendTo($('#page-status-bar')).css(
      {
        width : "10%",
      });
    },
    
    updateStatusBar : function(percent)
    {
      $('#page-status-bar .progress-bar').css({
        width : percent + "%",
      });
    },
    
    hideStatusBar : function(complete)
    {
      var statusBar = $('#page-status-bar .progress-bar');
      if(complete)
        this.updateStatusBar(100);
      
      //Wait on CSS transition.
      statusBar.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(event){
        statusBar.off("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
        if(complete)
          statusBar.delay(300, 'fx');
        else
        {
          statusBar.addClass('progress-bar-danger');
          statusBar.delay(1000, 'fx');
        }
        
        statusBar.animate({
          opacity : 0,
        },{
          duration : 200,
          easing : 'linear'
        }).queue('fx', function(next)
        {
          statusBar.remove()
          return next();
        });
      });
    },
  
  });
  
  //==============================================//
  //              Main Menu View
  //==============================================//
  // Main navigation menu view
  this.MainMenuView = Backbone.View.extend({
    
    events : {
      'click a' : 'menuClick'
    },
    
    items : {
      'News' : 'news',

			'Hunts' : {
				'page' : 'hunts',
				'loggedIn' : true,
				'adminLevel' : 2
			},

      'Profile' : {
        'page' : 'profile',
        'loggedIn' : true
      },

      
      'About' : 'about',
      
      'Free Company Board' : 'url:http://na.finalfantasyxiv.com/lodestone/freecompany/9232379236109516818/forum/',
      
      'Dashboard' : {
        'page' : 'dashboard',
        'loggedIn' : true,
        'adminLevel' : 3
      },
    },
    
    initialize : function()
    {

      aethyrnet.events.on('user:logInOut', this.render.bind(this));
      
      this.template = _.template("\
      <% for(var idx in items) { %>\
        <li <%= ( activePage === items[idx] ? 'class=\"active\"' : '') %>><a href=\"<%= items[idx] %>\"><%= idx %></a></li>\
      <% } %>");
      this.render();
      
      this.listenTo(aethyrnet.router, 'route', this.checkRoute.bind(this));
    },
    
    render : function()
    {
      var activePage = location.pathname.trim();
      
      //Fix for default page.
      if(activePage === '/')
        activePage = "/news";
    
      var items = {};
      for(var idx in this.items)
      {
        //Convert basic strings to proper link objects.
        if(typeof(this.items[idx]) == 'string')
          this.items[idx] = {
            page : this.items[idx],
          }
        
        
        var page = this.items[idx].page;
        
        //Shave URL strings and prefix hashbangs
        if(page.substring(0,4) == 'url:')
          page = page.substring(4);
        else
          page = "/" + page;
        
        //Ensure login requirement for log-in required items.
        if((!this.items[idx].loggedIn) || (aethyrnet.user.loggedIn()))
          if((!this.items[idx].adminLevel) || (aethyrnet.user.get('adminLevel') >= this.items[idx].adminLevel))
            items[idx] = page;
      }
      
      this.$el.html(this.template({
        //Template vars
        items : items,
        activePage : activePage
      }));
    },
    
    // CheckRoute is fired each time aethyrnet.router routes us anywhere.
    checkRoute : function(router, route, params)
    {
      route = '/' + route;
      if(route == '/')
        route = "/news";
      
      this.$el.find('.active').removeClass('active');
      
      //Activate the button if it matches our route.
      this.$el.find("a[href='"+route+"']").parent().addClass('active');
    },
    
    menuClick : function(event)
    {
      var $target = $(event.target);
      if($target.parent().hasClass('active'))
        return aethyrnet.viewport.reload();
    }
    
  });
  
  //==============================================//
  //           Alert Notification View
  //==============================================//
  this.AlertView = Backbone.View.extend({
    
    id : 'alertPanel',
    
    initialize : function()
    {
      aethyrnet.notify = this.post.bind(this);
      
      aethyrnet.error = function(msg)
      {      
        this.post.call(this, msg, "ERROR");
      }.bind(this);
      
      this.popError();
    },
    
    popError : function()
    {
      if(aethyrnet.errors.length > 0)
      {
        var error = aethyrnet.errors.splice(0, 1)[0];
        aethyrnet.error(error);
      }
    },
    
    render : function()
    {
    },
    
    post : function(msg, type)
    {
      var classname = "alert-info";
      
      var type = type || "";
      type = type.toUpperCase();
      
      var message = msg;
      if(typeof(msg) != 'string')
        message = msg.toString()
      
      if(type == "ERROR")
        classname = "alert-danger";
      else if(type == "SUCCESS")
        classname = "alert-success";
      else if(type == "WARNING")
        classname = "";
        
      
      //First, change our displayed text.
      this.$el.queue('fx',function(next){
        this.$el.attr("class", "alert " + classname);
        
        var typestring = (type ? "<strong>" + type + ":</strong> " : "");
        
        this.$el.html(message).html( typestring + this.$el.html());
        next();
      }.bind(this)).animate({
        //Then animate us visible
        top : "10%",
        
      }, 300).delay(2500).animate({
        //Then delay, then animate us back out.
        top : -60,
        
      }, 300).queue('fx', function(next){
        //Now remove error text and class.
        this.$el.text("");
        this.$el.removeClass(type);
        this.popError();
        next();
      }.bind(this));
    },
    
    clear : function()
    {
    }
    
  });
  
    
  //==============================================//
  //              Sidebar View
  //==============================================//
  this.SidebarView = Backbone.View.extend({
    id : "sidebar",
    className : "right",
    
    setMenu : function(menu)
    {
      this.menu = menu || {};
      
      this.$el.attr("class", aethyrnet.user.get("sidebarOrientation"));
      this.$el.css('position', ( aethyrnet.user.get('sidebarSticky') ? 'fixed' : 'absolute'));
      
      this.render();
    },
    
    initialize : function(menu)
    {
      this.setMenu(menu);
    },
    
    render : function()
    {
      //Kill events hash.
      this.events = {};
      
      //Wipe out content.
      this.$el.html("");
    
      for(var idx in this.menu)
      {
        var item = this.menu[idx];
        
        //Skip logged in only items when not logged in.
        if(item.loggedIn && !aethyrnet.user.loggedIn())
          continue;
        
        //Defaults.
        item.className = item.className || idx;
        item.text = item.text || idx;
        item.callback = item.callback || function(){};
        
        var elem = $(document.createElement('div'));
        elem.appendTo(this.$el);
        
        //Assign values to element.
        elem.text(item.text);
        elem.addClass("sidebutton " + item.className)
        this.events['click .'+item.className] = item.callback;        
      }
      
      this.delegateEvents();
    },
  });


  //===========================================//
  //        Base Boilerplate Page View
  //===========================================//
  this.PageView = Backbone.View.extend({
    id : "page-frame",
    
    initialize : function()
    {
      this.security = this.security || {};
      
      //Client-side security checking.
      if(this.security.loggedIn && !aethyrnet.user.loggedIn())
        throw new aethyrnet.SecurityError("You must be logged in to access this page.");
      
      if(this.security.adminLevel && aethyrnet.user.get('adminLevel') < this.security.adminLevel)
        throw new aethyrnet.SecurityError("You do not have rights to access this page.");
      
      this.neverRendered = true;
      
      if(this.initializePage)
        return this.initializePage.apply(this, arguments);
    },
    
    render : function(options)
    {
      var ret = true;
      
      options = options || {};
      console.log(arguments);
     
            
      //Render the page.
      if(options.subpage && this.renderSubpage)
        ret = this.renderSubpage.apply(this, _.rest(arguments).unshift(options.subpage));
      else if(this.renderPage)
        ret = this.renderPage.apply(this, _.rest(arguments));
      
      //Allow custom page rendering to cancel the page-frame:render event.
      if(ret !== false)
      {
        aethyrnet.events.trigger('page-frame:render');
        aethyrnet.events.trigger('page-frame:renderComplete');
      }
    },
    
    //Default page render
    renderPage : function()
    {
      //Render template file.
      if(this.template)
        this.$el.html(this.template());
      
      return true;
    }
    
  });
})();

aethyrnet.PageView = aethyrnet.backbone['viewport'].PageView;

//====================================================//
//                     Router
//====================================================//

//Main map from client-safe pageNames to viewStrings.
aethyrnet.viewMap = {
  'news' : 'feed.FeedView',
  'profile' : 'profile.ProfileView',
	'lcs' : 'lcs.LcsView',
  'about' : 'about.AboutView',
  'hunts' : 'hunts.HuntView',
  'recruitment' : 'about.RecruitmentView',
  'dashboard' : 'admin.DashboardView',
};

aethyrnet.router = new (Backbone.Router.extend({
  routes : {
    //Ghetto router mode, go!
    '' : 'standardPage',
    ':page' : 'standardPage',
    ':page/*subpage' : 'standardPage',
  },
  
  
  //Basic translation from client pages to viewStrings.
  standardPage : function(page, subpage)
  {
    if(!subpage)
      subpage = '';
  
    var firstPage = false;
    if(!page)
    {
      //Default Page
      page = 'news';
      firstPage = true;
    }
    
    viewString = aethyrnet.viewMap[page];
    
    if(!viewString)
    {
      var errorMessage = "The page you request does not exist. :("
      if(aethyrnet.notify)
        aethyrnet.error(errorMessage);
      else
        aethyrnet.errors.push(errorMessage)
      return;
    }
    
    if(aethyrnet.viewport)
    {
      aethyrnet.viewport.render(page+'/'+subpage, firstPage);
    }
    else
    {
      //Optimization: Go ahead and retreive the backbone for the cache while we wait.
      aethyrnet.pageQueue = page+'/'+subpage;
      
      var bone = viewString.split('.')[0]
      if(bone)
        getBackbone(bone);
    }
    
    //Don't do shit, cap'n!
  },
}))();

Backbone.history.start({ pushState: true });

//====================================================//
//                  Util Functions
//====================================================//

//A simple loading queue class for storing functions which need to be called later.
var CacheQueue = function CacheQueue()
{
  var myQueue = [];
  
  this.queue = function(callback)
  {
    myQueue.push(callback);
  }
  
  this.proc = function()
  {
    for(var idx in myQueue)
    {
      myQueue[idx]();
    }
  }
};

function getBackbone(file, exec, callback){
  if(!callback)
  {
    callback = exec;
    exec = null;
  }

  async.waterfall([
    //First, load the script off cache or the web.
    function(callback)
    {
      //If we're currently waiting on script load/evaluation.
      if(aethyrnet.backbone[file] && aethyrnet.backbone[file] instanceof CacheQueue)
      { 
        //Then just queue us onto the list of waiting calls.
        return aethyrnet.backbone[file].queue(callback);
      }
    
      //Return the context from the previously executed file.
      if(aethyrnet.backbone[file])
      {
        return callback();
      }
      
      //Or load file from server if we haven't seen it yet.
      else
      {
        //Setup the CacheQueue to handle any other GetBackbone calls
        //to this backbone while we're still loading.
        var queue = aethyrnet.backbone[file] = new CacheQueue();
        queue.queue(callback);
        
        //Script should evaluate and add itself into the aethyrnet.
        $.getScript( '/public/js/' + file + '.js', function(data)
        {
					if(aethyrnet.backbone[file] instanceof CacheQueue)
					{
						console.log("Failed to load backbone script: " + file);
						return;
					}
          //Proc any other calls to this backbone that were cached.
          return queue.proc();
        });
      }
    },
  ],
  function(err)
  {
    var context = aethyrnet.backbone[file];
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

//Template retrieval function to prevent multi-loading template files.
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
  if(options.mainCSS !== false)
    options.mainCSS = true;
  options.template = ( options.template === undefined ? true : options.template );
  
  //Parallel loading of HTML and CSS assets.
  async.parallel(
  [
    function(callback)
    {
      if(!options.template)
        return callback(false);
        
      //Retreive from cache if we have it.
      if(aethyrnet.template[file])
        //Hijack async's exposed call.
        return async.nextTick(callback.bind(this, null, aethyrnet.template[file]));
        
      $.get('/public/templates/' + file + '.html', function(data, status, jqXHR)
      {
        if(status != 'success')
        {
          console.log("Failed to retreive template: " + file);
          return callback(status);
        }
        
        data = _.template(data);
        
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
        console.log("Failed to retrieve CSS: " + file);
        return callback(true);
      });
    },
  ],
  function(err, result)
  {
    if(options.view)
      options.view.template = result[0];
    return callback(err, result[0]);
  });
  
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
};

//Pretty Print Names
aethyrnet.util.prettyName = function(username)
{
  if(!username || typeof(username) != 'string')
    return '';
  
  //Capitalize first letter
  return (username.charAt(0).toUpperCase() + username.slice(1)).replace("_", " ");
};

aethyrnet.util.pad = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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

//=============================================//
//                Event Handler
//=============================================//
aethyrnet.events = _.clone(Backbone.Events);
if(aethyrnet.debug)
{
  aethyrnet.events.on('all', function(event)
  {
    console.log("Aethyrnet Event: " + event);
  });
  
  aethyrnet.router.on('route', function(route, params)
  {
    console.log("Aethyrnet Route: " + route + "/" + params);
  });
}

/*
var setImmediate = setImmediate || function setImmediateFn(func) {
  return setTimeout(func, 0);
};*/