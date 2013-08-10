aethyrnet.backbone['about'] = new (function(){

  //----------------------------------------
  //            About Page
  //----------------------------------------
  this.AboutView = aethyrnet.PageView.extend({
  
    initializePage : function(options)
    {      
      //Retrieve template files.
      getTemplate('about', { view : this }, function(err, context)
      {
        this.render();
      }.bind(this));
    },
    
    renderPage : function()
    {    
      //Always call base render for main page views.
      aethyrnet.PageView.prototype.render();
      
      //Render template file.
      this.$el.html(this.template({
      }));
    },
    
  });
  
  
  
  //----------------------------------------
  //         Recruitment Page
  //----------------------------------------
  this.RecruitmentView = aethyrnet.PageView.extend({
  });
  
  
})();