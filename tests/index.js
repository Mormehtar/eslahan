var assert = require("assert");

var DBEnv = require("..");

describe("DBEnv object", function () {

    it("Should be a function", function(){
        assert(typeof DBEnv == "function");
    });

    it("Should be constructor", function () {
        assert((new DBEnv()).constructor == DBEnv);
    });

    it("Should save DAO from construction", function () {
        var dao = {};
        assert((new DBEnv(dao)).dao == dao);
    });
});