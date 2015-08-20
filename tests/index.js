var assert = require("chai").assert;

var TableDao = require("./testHelpers").tableDao;
var Table = require("../table");
var DBEnvError = require("../errors");
var uuidField = require("../fields/uuid");
var dependencyField = require("../fields/dependency");

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

    describe("finalize method", function () {
        it("Should throw error if finalized already", function () {
            var env = new DBEnv();
            env.finalize();
            assert.throw(function () {
                env.finalize();
            }, DBEnvError);
        });

        it("Should finalize all tables", function () {
            var env = new DBEnv({"SomeTable": new TableDao()});
            var table = env.addTable("SomeTable");
            table.addField("id", uuidField(), true);
            env.finalize();
            assert.ok(table.finalized);
        });

        it("Should throw error if has not complete scheme of tables", function () {
            var env = new DBEnv({Daughter: new TableDao()});
            var mother = new Table("Mother", new TableDao());
            env.addTable("Daughter")
                .addField("id", uuidField(), true)
                .addField("mother", dependencyField(mother));
            assert.throw(function () {
                env.finalize();
            }, DBEnvError);
        });

        it("Should set priorities for tables", function () {
            var dao = new TableDao();
            var env = new DBEnv({
                mother: dao, father: dao, daughter: dao, grandFather: dao, someOther: dao
            });
            env.addTable("mother")
                .addField("id", uuidField(), true);
            env.addTable("grandFather", uuidField(), true)
                .addField("id", uuidField(), true);
            env.addTable("someOther")
                .addField("id", uuidField(), true);
            env.addTable("father")
                .addField("id", uuidField(), true)
                .addField("grandFather", dependencyField(env.getTable("grandFather")));
            env.addTable("daughter")
                .addField("id", uuidField(), true)
                .addField("mother", dependencyField(env.getTable("mother")))
                .addField("father", dependencyField(env.getTable("father")));
            env.finalize();

            assert.equal(env.tables["mother"].priority, 0);
            assert.equal(env.tables["grandFather"].priority, 0);
            assert.equal(env.tables["someOther"].priority, 0);
            assert.equal(env.tables["father"].priority, 1);
            assert.equal(env.tables["daughter"].priority, 2);
        });

        it("should create tableOrder property", function () {
            var env = new DBEnv(new TableDao(), function (tableName, dao) {
                return dao;
            });
            env.addTable("mother")
                .addField("id", uuidField(), true);
            env.addTable("grandFather", uuidField(), true)
                .addField("id", uuidField(), true);
            env.addTable("someOther")
                .addField("id", uuidField(), true);
            env.addTable("father")
                .addField("id", uuidField(), true)
                .addField("grandFather", dependencyField(env.getTable("grandFather")));
            env.addTable("daughter")
                .addField("id", uuidField(), true)
                .addField("mother", dependencyField(env.getTable("mother")))
                .addField("father", dependencyField(env.getTable("father")));
            env.finalize();
            assert.sameMembers(env.tableOrder, Object.keys(env.tables));
            assert.ok(env.tableOrder.indexOf("daughter") > env.tableOrder.indexOf("father"));
            assert.ok(env.tableOrder.indexOf("daughter") > env.tableOrder.indexOf("mother"));
            assert.ok(env.tableOrder.indexOf("father") > env.tableOrder.indexOf("grandFather"));
        });
    });

    describe("cleanUp method", function () {
        it("Should throw exception if environment not finalized", function () {
            var env = new DBEnv(new TableDao(), function (tableName, dao) {
                return dao;
            });
            assert.throw(function () {
                env.cleanup();
            }, DBEnvError);
        });

        it("Should cleanup data in right order", function () {
            var env = new DBEnv({
                mother: new TableDao(),
                father: new TableDao(),
                daughter: new TableDao(),
                grandFather: new TableDao()
            });
            env.addTable("mother")
                .addField("id", uuidField(), true);
            env.addTable("grandFather", uuidField(), true)
                .addField("id", uuidField(), true);
            env.addTable("father")
                .addField("id", uuidField(), true)
                .addField("grandFather", dependencyField(env.getTable("grandFather")));
            env.addTable("daughter")
                .addField("id", uuidField(), true)
                .addField("mother", dependencyField(env.getTable("mother")))
                .addField("father", dependencyField(env.getTable("father")));
            env.finalize();
            env.getTable("daughter").insert();
            env.cleanup();
            assert.ok(env.dao["daughter"].delete.calledBefore(env.dao["mother"].delete), "Mother should not be deleted before daughter");
            assert.ok(env.dao["daughter"].delete.calledBefore(env.dao["father"].delete), "Father should not be deleted before father");
            assert.ok(env.dao["father"].delete.calledBefore(env.dao["grandFather"].delete), "GrandFather should not be deleted before father");
        });
    });
});