var assert = require("chai").assert;
var moment = require("moment");
var fields = require("../..").fields;
var field = fields.datetime;
var REPEATS = 100;

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
        var f = field({transformer: null});
        for (var i = REPEATS; i--;) {
            var begin = moment().subtract(1, 'ms');
            var result = moment(f());
            var end = moment().add(1, 'ms');
            assert.ok(result.isBetween(begin, end));
        }
    });

    it("Should return result in range of nearest seven days", function () {
        var f = field({to: moment().add(7, 'd'), transformer: null});
        var end = moment().add(7, 'd').add(1, 'ms');
        var begin = moment().subtract(1, 'ms');
        var result = moment(f());
        assert.ok(result.isBetween(begin, end));
    });

    it("Should return result in range of previous seven days", function () {
        var f = field({from: moment().subtract(7, 'd'), transformer: null});
        var begin = moment().subtract(7, 'd').subtract(1,'ms');
        for (var i = REPEATS; i--;) {
            var end = moment().add(1, 'ms');
            var result = moment(f());
            assert.ok(result.isBetween(begin, end));
        }
    });

    it("Should return result in given range", function () {
        var point = moment();
        var f = field({from: point.clone().subtract(7, 'd'), to: point.clone().add(7, 'd'), transformer: null});
        var begin = point.clone().subtract(7, 'd').subtract(1,'ms');
        var end = point.clone().add(7, 'd').add(1, 'ms');
        for (var i = REPEATS; i--;) {
            var result = moment(f());
            assert.ok(result.isBetween(begin, end));
        }
    });

    it("Should write data in iso format", function () {
        var f = field();
        var result = f();
        assert.instanceOf(result.model, Date);
        assert.typeOf(result.insert, "string");
        assert.deepEqual(result.model, new Date(result.insert));
    });
});