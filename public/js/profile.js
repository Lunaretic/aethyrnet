aethyrnet.backbone['profile'] = new (function(){
  var jobList = {
    "Tank" : [
      "Paladin",
      "Warrior",
    ],
    "Melee DPS" : [
      "Monk",
      "Dragoon",
    ],
    "Ranged DPS" : [
      "Bard",
      "Black Mage",
      "Summoner",
    ],
    "Support" : [
      "White Mage",
      "Scholar",
    ]
  };

  this.ProfileView = aethyrnet.PageView.extend({
        
    events : {
      'click #logoutButton' : 'logOut',
      //'click #bgImage-input li' : 'bgChange',
      'click li' : 'dropdownChange',
      'change input' : 'updateServer',
    },
    
    security : {
      loggedIn : true,
    },
        
    initializePage : function()
    {
      this.model = aethyrnet.user;
      
      //Set up Security options
      security = {
        loggedIn : true,
      };
      
      async.parallel([
        //Get template.
        getTemplate.bind(this, 'profile', { css : true, view : this, mainCss : true }),
        
        //Update user data.
        function(callback){
          aethyrnet.user.fetch().always(function()
          {
            this.render();
          }.bind(this));
        }.bind(this),
        
      ], function(err)
      {
        this.render();
      });
    },
    
    renderPage : function()
    {
      this.$el.html(this.template({
        //Template vars
        username : aethyrnet.util.prettyName(aethyrnet.user.get('username')),
        avatar : aethyrnet.user.get('avatar'),
        
        //sections
        sections : {
          "User Info" : {
            "email" : {
              type : 'text',
              text : 'Email',
              default : 'Email',
              value : aethyrnet.user.get('email'),
            },
            "charName" : {
              type : 'text',
              text : 'Character Name',
              default : 'Character Name',
              value : aethyrnet.user.get('charName'),
            },
            "charUrl" : {
              type : 'text',
              text : 'Character URL',
              default : 'http://na.finalfantasyxiv.com/lodestone/character/######/',
              value : aethyrnet.user.get('charUrl'),
            },
          },
          "Character Preferences" : {
            "primaryJob" : {
              type : 'dropdown',
              text : 'Primary Job',
              default : 'No Primary Job',
              value : aethyrnet.user.get('primaryJob'),
              options : jobList,
            },
            "secondaryJob" : {
              type : 'dropdown',
              text : 'Secondary Job',
              default : 'No Secondary Job',
              value : aethyrnet.user.get('secondaryJob'),
              options : jobList,
            },
            "preferredActivity" : {
              type : 'dropdown',
              text : 'Preferred Activity',
              default : 'No Preferred Activity',
              value : aethyrnet.user.get('preferredActivity'),
              options : {
                'Social' : [
                  'Roleplaying',
                  'General Socializing',
                ],
                'PvE' : [
                  'Missions & Quests',
                  'Leveling',
                  'Instances & Raiding',
                ],
                'PvP' : [
                  'Colliseum',
                  'FC vs FC',
                  'GC vs GC',
                ],
                'Misc' : [
                  'Crafting',
                  'Gathering',
                ],
              },
            },
          },
          
          "Aethyrnet Preferences" : {
            "bgImage" : {
              type : 'dropdown',
              text : 'Background Image',
              default : '',
              value : aethyrnet.util.prettyName(aethyrnet.user.get('bgImage')),
              options : {
                'Concept Art' : {
                  'limsa_lominsa' : "Limsa Lominsa",
                  'uldah' : "Ul'Dah",
                  'gridania' : "Gridania",
                  'coerthas' : "Coerthas",
                }
              },
            },
            "sidebarOrientation" : {
              type : 'dropdown',
              text : 'Sidebar Orientation',
              default : '',
              value : aethyrnet.util.prettyName(aethyrnet.user.get('sidebarOrientation')),
              options : {
                'Direction' : {
                  'right' : "Right",
                  'left' : "Left",
                }
              },
            },
          },
        },
    }));
      
      $('input[type="text"]', this.$el).blur();
    },
  
    //TODO: Change to use model change event.
    //aethyrnet.util.changeBG($(event.target).text().toLowerCase().replace(" ","_").replace(/[^_a-z]/, ''));
    
    dropdownChange : function(event)
    {
      //Get top level of this dropdown.
      var $ct = $(event.currentTarget);
      var $top = $ct.parent().parent().parent();
      
      //Assign value.
      $top.find('.value').text($ct.text());
      $top.find('.value').attr('data-value', ($ct.attr('data-value') ? $ct.attr('data-value') : $ct.text()));
      
      //Pass to update function.
      this.updateServer($top.find('.input-group-btn'), $top.attr('id').slice(0,-6));
    },
    
    logOut : function(event)
    {
      aethyrnet.util.logOut();
    },
    
    //Function which parses the value from the event/element, and submits it via
    //Backbone's HTTP:Patch method to the server, along with some chrome for
    //the web forms.
    updateServer : function(event, id)
    {
      var $this;
      if('currentTarget' in event)
        $this = $(event.currentTarget);
      else
        $this = event;
      
      //The field & data to send to server.
      var data = {};
      var fieldName = id || ($this.attr('id').slice(0,-6));
      if($this.prop('tagName') === 'INPUT')
        data[fieldName] = $this.val();
      else
        data[fieldName] = $this.find('.value').attr('data-value');
      
      data._id = this.model.get('_id');
      
      //Set up for save.
      $this.removeClass('has-error').removeClass('has-success');
      
      //Backbone smart save/patch.
      this.model.save(data, {patch: true}).done(function()
      {
        $this.parent().addClass('has-success').delay(1500).queue('fx', function(next)
        {
          $(this).removeClass('has-success');
          return next();
        });
        $this.parent().find('.status').attr('class', 'status glyphicon glyphicon-ok');
        
      }).fail(function(jqXHR, textStatus, errorThrown) 
      {
        //Hard fail. Bad news bears.
        if(jqXHR.status != 400)
        {
          console.log("Hard Failure on jqXHR Request.");
          console.log(JSON.stringify(jqXHR) + " ||" + textStatus + " || " + errorThrown);
          return;
        }
        
        //Bad data.
        $this.parent().addClass('has-error').delay(1500).queue('fx', function(next)
        {
          $(this).removeClass('has-error');
          return next();
        });
        $this.parent().find('.status').attr('class', 'status glyphicon glyphicon-remove');
      }.bind(this));
    },
    
  });
  
})();