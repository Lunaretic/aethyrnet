var expect = require("expect.js");
var gently = global.GENTLY = new (require('gently'));

var reddit = require('../../src/query/reddit.js');

describe('reddit query', function()
{
  it('should handle contact failures', function(done)
  {
    //gently.expect(gently.hijacked.http, 'request', function(
    
    gently.hijacked['../util.js'].log = function(){}
    
    gently.expect(gently.hijacked['../util.js'], 'log', function(msg){});
    gently.expect(gently.hijacked['../util.js'], 'webGet', function(options, callback)
    {
      return callback("Fake Error");
    });
    gently.expect(gently.hijacked['../util.js'], 'log', function(msg)
    {
      expect(msg).to.be('Fake Error');
    });
    
    
    reddit.query({}, function(){
      done();
    });
  });
});
  
  