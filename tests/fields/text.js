var assert = require("chai").assert;
var field = require("../../fields/text");
var REPEATS = 100;

describe("Text field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        assert.isFunction(field());
    });

    it("Should return value if it exists", function(){
        assert.equal(field()("SomeData"), "SomeData");
    });

    it("Should return value if it exists and undefined", function () {
        assert.isUndefined(field()(undefined));
    });

    it("Should return latin string of length 2-8 by default", function () {
        var reg = /^\w{2,8}$/;
        var innerField = field();
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert.match(result, reg, "Fails with " + result);
        }
    });

    it("Should return latin string of got length +/-3 if got length", function () {
        var reg = /^\w{1,7}$/;
        var innerField = field({length: 4});
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert.match(result, reg, "Fails with " + result);
        }
    });

    it("Should return latin string of given length with given dispertion", function () {
        var reg = /^\w{3,5}$/;
        var innerField = field({length: 4, dispertion: 1});
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert.match(result, reg, "Fails with " + result);
        }
    });

    it("Should return latin string of strictly given length if dispertion is 0", function(){
        var reg = /^\w{3}$/;
        var innerField = field({length: 3, dispertion: 0});
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert.match(result, reg, "Fails with " + result);
        }
    });

    it("Should return latin string of length  5 if dispertion is 0", function(){
        var reg = /^\w{5}$/;
        var innerField = field({dispertion: 0});
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert.match(result, reg, "Fails with " + result);
        }
    });

    it("Should return latin string of length 0-3 even if there is negative possibility", function(){
        var reg = /^\w{0,3}$/;
        var innerField = field({length: 0});
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert.match(result, reg, "Fails with " + result);
        }
    });
});