if (global.GENTLY) require = GENTLY.hijack(require);

var expect = require("expect.js");
var gently = new (require('gently'));

var util = require('../src/util.js');

describe('util', function(){
  
  
  describe('makeSlug()', function()
  {
    it('should return expected Slugs', function(){
      expect(util.makeSlug('lunar wind')).to.be('lunar_wind');
      expect(util.makeSlug('Lunar Wind')).to.be('lunar_wind');
      expect(util.makeSlug('Lunar W\^@#ind3 ')).to.be('lunar_wind3');
    });
  });
  
  
  describe('clientErr()', function(){
    var res = {};
  
    
    gently.expect(res, 'setHeader', function(){});
    
    //Validate expected END input.
    gently.expect(res, 'end', function (str) {
      expect(str).to.be.a('string');
      var obj = JSON.parse(str);
      
      expect(obj).to.be.a('object');
      
      expect(obj.response).to.be('Error');
      expect(obj.err).to.be.a('string');
    });
    it('should provide expected res.end() output.', function()
    {
      util.clientErr(res, "Fake Error");
    });
  });
  
  
  describe('truncate()', function(){
    it('should properly provide truncated elipses', function()
    {
      expect(util.truncate('', 5)).to.be('');
      expect(util.truncate('Self Return', 20)).to.be('Self Return');
      expect(util.truncate('Mid Truncation', 7)).to.be('Mid...');
      expect(util.truncate('Space Truncation', 8)).to.be('Space...');
      expect(util.truncate('Space Truncation', 9)).to.be('Space...');
      expect(util.truncate('Length Measurement 1', 4).length).to.be.lessThan(5);
      expect(util.truncate('Length Measurement 2', 8).length).to.be.lessThan(9);
      expect(util.truncate('Length Measurement 3', 8).length).to.be.lessThan(9);
    });
    
    it('should properly handle strange input', function()
    {
      expect(util.truncate(5, 3)).to.be('5');
      expect(util.truncate.bind({})).to.throwException();
      expect(util.truncate('Hello',-2)).to.be('Hello');
      expect(util.truncate('Hello',0)).to.be('Hello');
      expect(util.truncate('Hello',1)).to.be('...');
    });
  });
  
});