var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.email;
var check = require("../testHelpers").check;

describe("Email field", function() {

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

    it("Should return email with defaults", function () {
        check(field(), /^\w{3,8}@\w{3,8}\.\w{1,3}$/);
    });

    it("Should return email with given parameters", function () {
        check(field({
            addressFrom: 4,
            addressTo: 9,
            serverFrom: 2,
            serverTo: 7,
            domainFrom: 2,
            domainTo: 4
        }), /^\w{4,9}@\w{2,7}\.\w{2,4}$/);
    });

});