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

    it("Should return latin string of length 2-8 by default", function () {
        check(field(), /^\w{2,8}$/);
    });

    it("Should return latin string of got length +/-3 if got length", function () {
        check(field({length: 4}), /^\w{1,7}$/);
    });

    it("Should return latin string of given length with given dispertion", function () {
        check(field({length: 4, dispertion: 1}), /^\w{3,5}$/);
    });

    it("Should return latin string of strictly given length if dispertion is 0", function(){
        check(field({length: 3, dispertion: 0}), /^\w{3}$/);
    });

    it("Should return latin string of length  5 if dispertion is 0", function(){
        check(field({dispertion: 0}), /^\w{5}$/);
    });

    it("Should return latin string of length 0-3 even if there is negative possibility", function(){
        check(field({length: 0}), /^\w{0,3}$/);
    });
});