var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.text;
var check = require("../testHelpers").check;

describe.only("Text field", function() {

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
        check(field({wordFrom: 1, wordTo: 7}), /^\w{1,7}$/);
    });

    it("Should allow to generate several words", function () {
        check(field({wordsFrom: 1, wordsTo: 3}), /^(\w{2,8} ){0,2}\w{2,8}$/);
    });

    it("Should allow to generate several words with predefined delimiter", function () {
        check(field({wordsFrom: 1, wordsTo: 3, delimiter: ".,"}), /^(\w{2,8}[.,]){0,2}\w{2,8}$/);
    });

    it("Should allow to generate text with given symbols", function () {
        check(field({symbols:field.symbols.DIGITS}), /^\d{2,8}$/);
    });
});