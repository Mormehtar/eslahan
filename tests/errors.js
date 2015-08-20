var DBEnvError = require("../errors");
var assert = require("chai").assert;

describe("Error", function () {
    it("Should be a function", function () {
        assert.isFunction(DBEnvError);
    });

    it("Should be a constructor", function () {
        assert.instanceOf(new DBEnvError(), DBEnvError);
    });

    it("Should be a constructor of Errors", function () {
        assert.instanceOf(new DBEnvError(), Error);
    });

    it("Should get message as param", function () {
        var err = new DBEnvError("SomeText");
        assert.equal(err.message, "SomeText");
    });
});