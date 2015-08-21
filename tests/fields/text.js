var assert = require("chai").assert;
var field = require("../../fields/text");
var check = require("../testHelpers").check;

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

    it("Should return null if options nullable", function () {
        assert.isNull(field({nullable:1})());
    });

    it("Should return latin string of length 2-8 by default", function () {
        check(field(), /^\w{2,8}$/);
    });

    it("Should return latin string of got length", function () {
        check(field({from: 1, to: 7}), /^\w{1,7}$/);
    });
});