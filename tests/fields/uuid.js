var assert = require("chai").assert;
var field = require("../../fields/uuid");
var check = require("../testHelpers").check;

describe("Uuid field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        assert.isFunction(field());
    });

    it("Should return value if it exists", function () {
        assert.equal(field()("47867ed8-1be3-43e0-be33-42ea7320dffd"), "47867ed8-1be3-43e0-be33-42ea7320dffd");
    });

    it("Should return value if it exists and undefined", function () {
        assert.isUndefined(field()(undefined));
    });

    it("Should return valid uuid", function () {
        check(field(), /^[\dabcdefABCDEF]{8}(:?-[\dabcdefABCDEF]{4}){3}-[\dabcdefABCDEF]{12}$/);
    });
});