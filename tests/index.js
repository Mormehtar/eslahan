var assert = require("chai").assert;

var TableDao = require("./testHelpers").tableDao;
var Table = require("../table");
var DBEnvError = require("../errors");

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

    describe("addTable method", function () {
        it("Should return Table object and save it", function () {
            var env = new DBEnv({"SomeTable": new TableDao()});
            var table = env.addTable("SomeTable");
            assert.instanceOf(table, Table);
        });

        it("Should fail if dao does not support table", function () {
            var env = new DBEnv({});
            assert.throw(function () {
                env.addTable("SomeTable");
            }, DBEnvError);
        });

        it("Should throw exception on adding table again", function () {
            var env = new DBEnv({"SomeTable": new TableDao()});
            env.addTable("SomeTable");
            assert.throw(function () {
                env.addTable("SomeTable");
            }, DBEnvError);
        });

        it("Should throw error on adding table into finalized env", function () {
            var env = new DBEnv({"SomeTable": new TableDao()});
            env.finalize();
            assert.throw(function () {
                env.addTable("SomeTable");
            }, DBEnvError);
        });
    });

    describe("getTable method", function () {
        it("Should return table by demand", function () {
            var env = new DBEnv({"SomeTable": new TableDao()});
            var table = env.addTable("SomeTable");
            assert.equal(table, env.getTable("SomeTable"));
        });

        it("Should throw error on getting not existent table", function () {
            var env = new DBEnv({"SomeTable": new TableDao()});
            assert.throw(function () {
                env.getTable("SomeTable")
            }, DBEnvError);
        });
    });
});