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
      'click #bgImage-input li' : 'bgChange',
      'click li' : 'dropdownChange',
      'change input' : 'inputChange',
    },
    
    security : {
      loggedIn : true,
    },
        
    initializePage : function()
    {
      //Set up Security options
      security = {
        loggedIn : true,
      };
      getTemplate('profile', { css : true, view : this, mainCss : true }, function()
      {
        //Refresh the user data.
        aethyrnet.user.fetch({
          success : function(mdl, res, err)
          {
            this.render();
          }.bind(this),
          error : function(mdl, res, err)
          {
            this.render();
          }.bind(this),
        });
      }.bind(this));
    },
    
    renderPage : function()
    {
      this.$el.html(this.template({
        //Template vars
        username : aethyrnet.util.prettyName(aethyrnet.user.get('username')),
        avatar : aethyrnet.user.get('avatar'),
        
        //Sections
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
    
    bgChange : function(event)
    {
      this.$el.find('#bgImage-input .value').html($(event.target).text());
      this.saveUser();
      
      //TODO: Change to use model change event.
      aethyrnet.util.changeBG($(event.target).text().toLowerCase().replace(" ","_").replace(/[^_a-z]/, ''));
    },
    
    dropdownChange : function(event)
    {
      $(event.currentTarget).parent().parent().find('.value').text($(event.target).text());
      this.saveUser();
    },
    
    inputChange : function(event)
    {
      this.saveUser();
    },
    
    logOut : function(event)
    {
      aethyrnet.util.logOut();
    },
    
    saveUser : function()
    {
      //Background attribute set previously.
      var opts = {
        email : $('#email-input',this.$el).val() || "",
        charName : $('#charName-input',this.$el).val() || "",
        charUrl : $('#charUrl-input',this.$el).val() || "",
        sidebarOrientation : $('#sidebarOrientation-input .value').text().toLowerCase(),
        sidebarSticky : ($('#sidebarSticky-input .value').text() == "Fixed Sidebar" ? true : false),
        bgImage : $('#bgImage-input .value').text().toLowerCase().replace(" ","_").replace(/[^_a-z]/, ''),
        primaryJob : ($('#primaryJob-input .value').text() != "No Primary Job" ? $('#primaryJob-input .value').text() : ""),
        secondaryJob : ($('#secondaryJob-input .value').text() != "No Secondary Job" ? $('#secondaryJob-input .value').text() : ""),
        preferredActivity : ($('#preferredActivity-input .value').text() != "No Preferred Activity" ? $('#preferredActivity-input .value').text() : ""),
      };
      
      var changed = {};
      for(var idx in opts)
      {
        if(opts[idx] != aethyrnet.user.get(idx))
        {
          changed[idx] = opts[idx];
          this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-retweet');
        }
      };
      
      
      //Save OK.
      this.$('.has-error').removeClass('has-error');
      this.$('.has-success').removeClass('has-success');
      
      
      //Backbone smart save.
      aethyrnet.user.save(changed, {patch: true}).done(function()
      {
        
        for(idx in changed)
        {
          this.$('#'+idx+'-input').parent().addClass('has-success').delay(1500).queue('fx', function(next)
          {
            $(this).removeClass('has-success');
            return next();
          });
          this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-ok');
        }
        
      }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) 
      {
        //Hard fail. Bad news bears.
        if(jqXHR.status != 400)
        {
          console.log("Hard Failure on jqXHR Request.");
          console.log(JSON.stringify(jqXHR) + " ||" + textStatus + " || " + errorThrown);
          return;
        }
        
        //Bad data.
        for(idx in changed)
        {
          if(idx in jqXHR.responseJSON.err)
          {
            this.$('#'+idx+'-input').parent().addClass('has-error').delay(1500).queue('fx', function(next)
            {
              $(this).removeClass('has-error');
              return next();
            });
            this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-remove');
          }
          else
          {
          this.$('#'+idx+'-input').parent().addClass('has-success').delay(1500).queue('fx', function(next)
          {
            $(this).removeClass('has-success');
            return next();
          });
          this.$('#'+idx+'-input').parent().find('.status').attr('class', 'status glyphicon glyphicon-ok');
          }
        }
      }.bind(this));
    },
    
  });
  
})();