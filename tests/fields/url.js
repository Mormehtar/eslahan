var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.url;
var check = require("../testHelpers").check;

describe("Url field", function() {

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

    it("Should return url with defaults", function () {
        check(field(), /^\w{3,8}.\w{2,3}(\\\w{3,8})?$/);
    });

    it("Should return url with given parameters", function () {
        check(field({
            domainsOptions: [
                {
                    from: 4,
                    to: 5
                },
                {
                    from: 2,
                    to: 3
                }
            ],
            pathFrom: 0,
            pathTo: 3
        }), /^\w{2,3}.\w{4,5}(\\\w{0,3})?$/);
    });

    it("Should return url with predefined domain if passed", function () {
        check(field({
            domainsOptions: [
                {
                    value: "com"
                },
                {
                    from: 3,
                    to: 8
                }
            ]
        }), /^\w{2,3}.com(\\\w{3,8})?$/);
    });

    it("Should return url with predefined predefined path if passed", function () {
        check(field({
            path: "random"
        }), /^\w{3,8}.\w{2,3}\\random$/);
    });

    it("Should not return url with ending slash if no path", function () {
        check(field({
            path: ""
        }), /^\w{3,8}.\w{2,3}$/);
    });

});