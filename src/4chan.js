
var query_chan = function(callback)
{
  console.log("Begining 4Chan Query.");
  async.waterfall([
    function(callback)
    {
      //Scan for old modified value
      db.model('feed').findOne({ name : '4chan'}, function(err, doc) 
      {
        if(err || !doc)
          return callback(null, null);
        return callback(null, doc.modified);
      });
    },
    function(modified, callback)
    {
      //Base JSON data.
      var data = "{}";
    
      //Options for 4chan API query.
      var options = {
        host: 'api.4chan.org',
        port: 80,
        path: '/v/0.json',
      };
      
      if(modified)
      {
        options.headers = {
          'If-Modified-Since': modified 
        };
      }
    
      //Run Query.
      http.get(options, function(res) {
      
        //Good Result
        //console.log("Got response: " + res.statusCode);
        
        if(res.statusCode != 200)
          return callback("Error " + res.statusCode + " response from api.4chan.org");
        
        
        var data = '';
        
        //For a good response, wait for full page.
        res.on('data', function (chunk) {
          data  += chunk;
        });

        res.on('end', function(){
          return callback(null, data, null, res.headers['last-modified']);
        });
            
        
      }).on('error', function(e) {
      
        //Error
        console.log("Got error: " + e.message);
        return callback(e);
        
      });
    },
    
    //Parse our result from 4Chan.
    function(data, images, modified, callback)
    {
      var data = JSON.parse(data);
      var images = [];
      
      for(var tIdx in data.threads)
      {
        for(var pIdx in data.threads[tIdx].posts)
        {
          var file = data.threads[tIdx].posts[pIdx].tim;
          var ext = data.threads[tIdx].posts[pIdx].ext;
          
          if(!file)
            continue;
          
          //Compile our list of images.
          images.push(file + ext);
        }
      }
      return callback(null, data, images, modified);
    },
    
    //Build new ImageList
    function(data, images, modified, callback)
    {
      var nImages = {};
      async.forEach(images, function(img, callback)
      {
        fs.exists(__dirname + '/public/4clone/' + img, function(res)
        {
          if(!res)
            nImages[img] = true;
          return callback();
        });
      },
      function(err)
      {
        callback(err, data, Object.keys(nImages), images, modified);
      });
    },
    
    //Download new files.
    function(data, images, imagesFull, modified, callback)
    {
      
      async.forEachSeries(images, function(img, callback)
      {
        //Options for 4chan API query.
        var options = {
          host: 'images.4chan.org',
          port: 80,
          path: '/v/src/' + img,
        };
        
        console.log('Attempting to download: ' + img);
        http.get(options, function(res)
        {
          //console.log("Response received: " + res.statusCode);
          //Skip bad file.
          if(res.statusCode != 200)
            return callback();
            
          res.on('error', function(err)
          {
            return callback(err);
          });
            
          res.pipe(fs.createWriteStream(__dirname + '/public/4clone/' + img));
          
          res.on('end', function(){
            //console.log("File Done.");
            return callback();
          });
        });
      
      },
      function(err)
      {
        //Finish 4chan image download block.
        return callback(err, data, imagesFull, modified);
      });
    },
    
    //Input new data into the DB.
    function(data, images, modified, callback)
    {
      console.log("Scanning for new 4chan data..");
      db.model('feed').findOne({ name : '4chan'}, function(err, doc) 
      {
        if(err)
        {
          console.log("Error while retrieving 4chan data.");
          return callback(err);
        }
        
        //Construct feedEntry objects from the data in question.
        var feedEntries = [];
        for(var idx in data.threads)
        {
          var temp = {};
          temp.date = new Date(data.threads[idx].now);
          temp.thread = data.threads[idx];
          feedEntries.push(temp);
        }
        
        
        if(doc)
        {
          console.log("4chan data found, updating..");
          
          doc.feed = feedEntries;
          doc.date = new Date();
          doc.modified = modified;
          
          doc.save(function(err)
          {
            return callback(err, data, images, modified);
          });
        }
        else 
        {
          var mdl = new (db.model("feed"))({ name : "4chan"});
          
          mdl.feed = feedEntries;
          mdl.date = new Date();
          mdl.modified = modified;
          
          mdl.save();
          console.log("Created new 4chan data.");
          return callback(null, data, images, modified);
        }
      });
    },
    
    //Clean directory of old files.
    function(data, images, modified, callback)
    {
      console.log("Triggering clean on old files.");
      fs.readdir(__dirname + '/public/4clone/', function(err, files)
      {
        if(err)
          return callback(err);
        
        function fDel(file)
          {
            ArrayContains(images, file, function(res)
            {
              if(!res)
              {
                console.log("Deleting File: " + file);
                fs.unlink(__dirname + '/public/4clone/' + file, function(err)
                {
                  if(err)
                    console.log(err);
                });
              }
            });
          }
        
        for(var idx in files)
        {
          fDel(files[idx]);  
        }
        return callback(null, images, files);
      });
    },
  ],
  
  //Final notification
  function(err, result)
  {
    if(err)
      console.log("4Chan Error: " + err);
    else
      console.log("4Chan Query OK.");
      
    return callback();
  });
};







//var feed = [];
/*
//First, query db for raw info.
db.model('feed').findOne({ name : '4chan'}, function(err, doc)
{
  if(err || !doc)
    return callback(err, feed);
  
  //Each 4Chan thread.
  for(var idx in doc.feed)
  {
    var entry = {};
    
    entry.source = '4Chan';
    entry.date = doc.feed[idx].date;
    entry.title = doc.feed[idx].thread.posts[0].sub;
    entry.content = doc.feed[idx].thread.posts[0].com;
    
    feed.push(entry);
  }
  return callback(null, feed);
});*/