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
    
  });
  
  
  
  //----------------------------------------
  //         Recruitment Page
  //----------------------------------------
  this.RecruitmentView = aethyrnet.PageView.extend({
  });
  
  
})();