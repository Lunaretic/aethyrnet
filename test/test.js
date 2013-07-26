var expect = require("expect.js");
var gently = new (require('gently'));
var lorem = require('lorem-ipsum');

describe('Gently', function(){
  it('should intercept our MIA function call.', function(done){
    var api = {};
    
    gently.expect(api, 'call', function (url, callback) {
      expect(url).to.be('http://api.twitter.com/...');
      callback(Error('Fake error'), null);
    });
    
    api.call('http://api.twitter.com/...', function (error, response) {
      done();
    });
  });
});
