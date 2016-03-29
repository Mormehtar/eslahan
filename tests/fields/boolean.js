var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.boolean;

var REPEATS = 100;

describe("boolean field", function() {

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

    it("Should return boolean", function () {
        var f = field();
        assert.typeOf(f(), "boolean");
    });
});