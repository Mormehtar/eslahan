var assert = require("chai").assert;
var fields = require("../fields");

describe("Fields", function () {
    it("Should export fields", function () {
        assert.isObject(fields);
    });

    it("Should export dependency", function () {
        assert.equal(fields.dependency, require("../fields/dependency"));
    });

    it("Should export uuid", function () {
        assert.equal(fields.uuid, require("../fields/uuid"));
    });
});