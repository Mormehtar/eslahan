var assert = require("chai").assert;
var moment = require("moment");
var field = require("../../fields/datetime");
var check = require("../testHelpers").check;

describe("DateTime field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        assert.isFunction(field());
    });

    it("Should return value if it exists", function () {
        assert.equal(field()("SomeData"), "SomeData");
    });

    it("Should return value if it exists and undefined", function () {
        assert.isUndefined(field()(undefined));
    });

    it("Should return null if options nullable", function () {
        assert.isNull(field({nullable: 1})());
    });

    it("Should return NOW by default", function () {
        var f = field();
        var begin = moment().subtract(1, 'ms');
        var result = moment(f());
        var end = moment().add(1, 'ms');
        assert.ok(result.isBetween(begin, end));
    });

    //it("Should return result in range of nearest week if not now", function () {
    //    var f = field();
    //    var result = moment(f({now: false}));
    //})

});