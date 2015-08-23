var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.increment;

describe("Increment field", function() {

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

    it("Should return integers 1, 2, 3 and so on by default", function () {
        var f = field();
        assert.equal(f(), 1);
        assert.equal(f(), 2);
        assert.equal(f(), 3);
    });


    it("Should return integers from given beginning", function () {
        var f = field({from: 5});
        assert.equal(f(), 5);
        assert.equal(f(), 6);
        assert.equal(f(), 7);
    });
});