var assert = require("chai").assert;

var DBEnv = require("..");

describe("DBEnv object", function () {

    it("Should be a function", function(){
        assert.isFunction(DBEnv);
    });

    it("Should be constructor", function () {
        assert.instanceOf(new DBEnv(), DBEnv);
    });

    it("Should save DAO from construction", function () {
        var dao = {};
        assert.equal((new DBEnv(dao)).dao, dao);
    });
});