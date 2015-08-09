var assert = require("assert");
var field = require("../../fields/text");
var REPEATS = 100;

describe("Text field", function() {

    it("Should exist", function () {
        assert(typeof field === "function");
    });

    it("Should return function", function () {
        assert(typeof field() === "function");
    });

    it("Should return value if it exists", function(){
        assert(field()("SomeData") === "SomeData");
    });

    it("Should return value if it exists and undefined", function () {
        assert(field()(undefined) === undefined);
    });

    it("Should return latin string of length 2-8 by default", function () {
        var reg = /^\w{2,8}$/;
        var innerField = field();
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert(reg.test(result), "Fails with " + result);
        }
    });

    it("Should return latin string of got length +/-3 if got length", function () {
        var reg = /^\w{1,7}$/;
        var innerField = field(4);
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert(reg.test(result), "Fails with " + result);
        }
    });

    it("Should return latin string of given length with given dispertion", function () {
        var reg = /^\w{3,5}$/;
        var innerField = field(4, 1);
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert(reg.test(result), "Fails with " + result);
        }
    });

    it("Should return latin string of strictly given length if dispertion is 0", function(){
        var reg = /^\w{3}$/;
        var innerField = field(3, 0);
        for (var i = 0; i<REPEATS; ++i) {
            var result = innerField();
            assert(reg.test(result), "Fails with " + result);
        }
    });
});