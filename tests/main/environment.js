var uuid = require("uuid").v4;
var Promise = require("bluebird");
var assert = require("chai").assert;
var sinon = require("sinon");

var TableDao = require("./../testHelpers").tableDao;
var Table = require("../../main/table");
var eslahan = require("../..");
var DBEnvError = eslahan.DBEnvError;
var fields = eslahan.fields;

var DBEnv = eslahan.DBEnv;

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
            table.addField("id", fields.uuid(), true);
            env.finalize();
            assert.ok(table.finalized);
        });

        it("Should throw error if has not complete scheme of tables", function () {
            var env = new DBEnv({Daughter: new TableDao()});
            var mother = new Table("Mother", new TableDao());
            env.addTable("Daughter")
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(mother));
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
                .addField("id", fields.uuid(), true);
            env.addTable("grandFather", fields.uuid(), true)
                .addField("id", fields.uuid(), true);
            env.addTable("someOther")
                .addField("id", fields.uuid(), true);
            env.addTable("father")
                .addField("id", fields.uuid(), true)
                .addField("grandFather", fields.dependency(env.getTable("grandFather")));
            env.addTable("daughter")
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(env.getTable("mother")))
                .addField("father", fields.dependency(env.getTable("father")));
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
                .addField("id", fields.uuid(), true);
            env.addTable("grandFather", fields.uuid(), true)
                .addField("id", fields.uuid(), true);
            env.addTable("someOther")
                .addField("id", fields.uuid(), true);
            env.addTable("father")
                .addField("id", fields.uuid(), true)
                .addField("grandFather", fields.dependency(env.getTable("grandFather")));
            env.addTable("daughter")
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(env.getTable("mother")))
                .addField("father", fields.dependency(env.getTable("father")));
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
                .addField("id", fields.uuid(), true);
            env.addTable("grandFather", fields.uuid(), true)
                .addField("id", fields.uuid(), true);
            env.addTable("father")
                .addField("id", fields.uuid(), true)
                .addField("grandFather", fields.dependency(env.getTable("grandFather")));
            env.addTable("daughter")
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(env.getTable("mother")))
                .addField("father", fields.dependency(env.getTable("father")));
            env.finalize();
            env.getTable("daughter").insert();
            env.cleanup();
            assert.ok(env.dao["daughter"].truncate.calledBefore(env.dao["mother"].truncate), "Mother should not be deleted before daughter");
            assert.ok(env.dao["daughter"].truncate.calledBefore(env.dao["father"].truncate), "Father should not be deleted before father");
            assert.ok(env.dao["father"].truncate.calledBefore(env.dao["grandFather"].truncate), "GrandFather should not be deleted before father");
        });
    });

    it("Should allow self dependent table", function () {
        var env = new DBEnv({
            table: new TableDao()
        });
        var table = env.addTable("table");
        table
            .addField("id", fields.uuid(), true)
            .addField("parent", fields.dependency(table, {dependsOnExistent: true}));
        env.finalize();
    });

    describe("saveFixture method", function () {

        it("Should fail on not finalized", function (done) {
            var dao1 = new TableDao();
            var dao2 = new TableDao();

            var env = new DBEnv({
                table1: dao1,
                table2: dao2
            });

            var table1 = env.addTable("table1");
            table1.addField("id", fields.uuid(), true);

            var table2 = env.addTable("table2");
            table2
                .addField("id", fields.uuid(), true)
                .addField("fk", fields.dependency(table1, {dependsOnExistent: true}));

            env.saveFixture().then(function () {
                done("Hadn`t throw exception!");
            }).catch(function (error) {
                assert.instanceOf(error, DBEnvError);
                done();
            }).catch(done);
        });

        it("Should allow to save fixtures for all tables", function (done) {
            var dao1 = new TableDao();
            var dao2 = new TableDao();

            var etalon1 = [{id: uuid()}, {id: uuid()}];
            var etalon2 = [{id: uuid(), fk: etalon1[0].id}, {id:uuid(), fk: etalon1[1].id}];

            dao1.select.returns(Promise.resolve(etalon1));
            dao2.select.returns(Promise.resolve(etalon2));

            var env = new DBEnv({
                table1: dao1,
                table2: dao2
            });

            var table1 = env.addTable("table1");
            table1.addField("id", fields.uuid(), true);

            var table2 = env.addTable("table2");
            table2
                .addField("id", fields.uuid(), true)
                .addField("fk", fields.dependency(table1, {dependsOnExistent: true}));

            env.finalize();

            env.saveFixture().then(function () {
                assert.deepEqual(table1.fixture, etalon1);
                assert.deepEqual(table2.fixture, etalon2);
                done();
            }).catch(done);
        });

    });

    describe("setFixture method", function () {

        it("Should throw exception if environment not finalized", function () {
            var env = new DBEnv(new TableDao(), function (tableName, dao) {
                return dao;
            });
            assert.throw(function () {
                env.setFixture();
            }, DBEnvError);
        });

        it("Should set fixtures in right order", function () {
            var dao1 = new TableDao();
            var dao2 = new TableDao();

            var etalon1 = [{id: uuid()}, {id: uuid()}];
            var etalon2 = [{id: uuid(), fk: etalon1[0].id}, {id:uuid(), fk: etalon1[1].id}];

            var env = new DBEnv({
                table1: dao1,
                table2: dao2
            });

            var spyCleanup = sinon.spy(env, "cleanup");

            var table1 = env.addTable("table1");
            table1.addField("id", fields.uuid(), true);
            table1.fixture = etalon1;
            var spy1 = sinon.spy(table1, "setFixture");


            var table2 = env.addTable("table2");
            table2
                .addField("id", fields.uuid(), true)
                .addField("fk", fields.dependency(table1, {dependsOnExistent: true}));
            table2.fixture = etalon2;
            var spy2 = sinon.spy(table2, "setFixture");

            env.finalize();

            env.setFixture();

            assert.isTrue(spyCleanup.calledBefore(spy1), "CleanUp must be made before first table fixtures!");
            assert.isTrue(spyCleanup.calledBefore(spy2), "CleanUp must be made before second table fixtures!");
            assert.isTrue(spy1.calledBefore(spy2), "first table fixtures must by set before second table");
        });
    });
});