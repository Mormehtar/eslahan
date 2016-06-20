var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.point;

var REPEATS = 100;

describe("Point field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        assert.isFunction(field());
    });

    it("Should return value if it exists", function () {
        assert.equal(field()(2), 2);
    });

    it("Should return transformed value if possible", function () {
        assert.deepEqual(field()({x:2, y: 3}), {model: {x:2, y: 3}, insert: "(2,3)"});
    });

    it("Should return value if it exists and undefined", function () {
        assert.isUndefined(field()(undefined));
    });

    it("Should return points in field -1..1 by default", function () {
        var f = field();
        for(var i = REPEATS; i--;) {
            var result = f();
            assert.isAtLeast(result.model.x, -1, 'x');
            assert.isAtMost(result.model.x, 1, 'x');
            assert.isAtLeast(result.model.y, -1, 'y');
            assert.isAtMost(result.model.y, 1, 'y');
            assert.equal(result.insert, '(' + result.model.x + ',' + result.model.y + ')');
        }
    });

    it("Should return points in given range independently if passed", function () {
        var f = field({x: {from: 2, to: 3}, y: {from: -3, to: -2}});
        for(var i = REPEATS; i--;) {
            var result = f();
            assert.isAtLeast(result.model.x, 2, 'x');
            assert.isAtMost(result.model.x, 3, 'x');
            assert.isAtLeast(result.model.y, -3, 'y');
            assert.isAtMost(result.model.y, -2, 'y');
            assert.equal(result.insert, '(' + result.model.x + ',' + result.model.y + ')');
        }
    });
});