var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.decimal;

var REPEATS = 100;

describe("decimal field", function() {

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

    it("Should return number from 0 to 100 with 2 numbers after dot by default", function () {
        var f = field();
        for(var i = REPEATS; i--;) {
            var result = f();
            assert.ok(result.indexOf(".") - result.length, 2);
            assert.ok(Number(result) >= 0, "Negative result!");
            assert.ok(Number(result) <= 100, "Too big result!");
        }
    });

    it("Should return number in given range with given number of numbers after dot", function () {
        var f = field({from: 5, to: 20, fractionalDigits: 3});
        for(var i = REPEATS; i--;) {
            var result = f();
            assert.ok(result.indexOf(".") - result.length, 3);
            assert.ok(Number(result) >= 5, "Negative result!");
            assert.ok(Number(result) <= 20, "Too big result!");
        }
    });
});