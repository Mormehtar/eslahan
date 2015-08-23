var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.float;

var REPEATS = 100;

describe("float field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        assert.isFunction(field());
    });

    it("Should return value if it exists", function () {
        assert.equal(field()(2), 2);
    });

    it("Should return value if it exists and undefined", function () {
        assert.isUndefined(field()(undefined));
    });

    it("Should return number from 0 to 100 by default", function () {
        var f = field();
        for(var i = REPEATS; i--;) {
            var result = f();
            assert.ok(result >= 0, "Negative result!");
            assert.ok(result <= 100, "Too big result!");
        }
    });

    it("Should return number in given range", function () {
        var f = field({from: 5, to: 20});
        for(var i = REPEATS; i--;) {
            var result = f();
            assert.ok(result >= 5, "Negative result!");
            assert.ok(result <= 20, "Too big result!");
        }
    });
});