aethyrnet.backbone['lcs'] = new (function(){
  this.LcsView = aethyrnet.PageView.extend({
    players : {},
		
    events : {
    },
            
    initializePage : function()
    {
			var myView = this;
      async.parallel([
        //Get template.
        getTemplate.bind(myView, 'lcs', { css : false, view : this, mainCss : true }),
				function(callback){
					$.get('/api/lcs', function(data){
						myView.players = data;
						return callback();
					}, 'json');
				},
      ], function(err)
      {
        myView.render();
      });
    },
    
    renderPage : function()
    {
			this.$el.html(this.template({
				players : this.players
			}));
    },
  });
})();