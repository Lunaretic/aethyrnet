aethyrnet.backbone['admin'] = new (function(){

  //----------------------------------------
  //            Admin Page
  //----------------------------------------
  this.DashboardView = aethyrnet.PageView.extend({
  
    initializePage : function(options)
    {      
      //Retrieve template files.
      getTemplate('dashboard', { view : this }, function(err, context)
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