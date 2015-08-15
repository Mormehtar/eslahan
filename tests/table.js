var assert = require("chai").assert;
var EtalonDao = require("./testHelpers").tableDao;

var Table = require("../table");

var uuidField = require("../fields/uuid");
var dependencyField = require("../fields/dependency");
var DBEnvError = require("../errors");

function createTestTable () {
    var table = new Table("TestTeable", new EtalonDao());
    table
        .addField("id", uuidField(), true)
        .addField("data", uuidField());
    table.finalize();
    return table;
}

describe("Table object", function () {

    it("Should exist", function () {
        assert.isFunction(Table);
    });

    it("Should be a constructor", function () {
        assert.instanceOf(new Table("SomeName", new EtalonDao()), Table);
    });

    it("Should initialize table object correctly", function () {
        var dao = new EtalonDao();
        var name = "TestTable";

        var table = new Table(name, dao);

        assert.equal(table.name, name);
        assert.equal(table.dao, dao);
        assert.isFalse(table.finalized);
        assert.isNull(table.key);
        assert.deepEqual(table.rows, {});
    });

    it("Should demand exactly 2 parameters", function () {
       assert.throw(function () {
           new Table();
       }, DBEnvError);
    });

    it("Should demand dao to be an object with insert and delete methods", function () {
        assert.throw(function () {
            new Table("Broken", {insert: function () {}});
        }, DBEnvError);

        assert.throw(function () {
            new Table("Broken", {delete: function () {}});
        }, DBEnvError);
    });

    describe("addField method", function () {
        it("Should add field correctly", function () {
            var table = new Table("TestTable", new EtalonDao());
            var generator = uuidField();
            var generatorKey = uuidField();
            var generator2 = uuidField();

            table
                .addField("uuid1", generator)
                .addField("uuidKey", generatorKey, true)
                .addField("uuid2", generator2, false);

            assert.equal(table.fields.uuid1, generator);
            assert.equal(table.fields.uuidKey, generatorKey);
            assert.equal(table.fields.uuid2, generator2);
            assert.equal(table.key, "uuidKey");
        });

        it("Should not add fields to finalized table", function () {
            var table = new Table("TestTable", new EtalonDao());
            table.addField("id", uuidField(), true);
            table.finalize();

            assert.throw(function () {
                table.addField("id2", uuidField());
            }, DBEnvError);
        });
    });

    describe("insert method", function () {

        it("Should fail if table is not finalized", function () {
            var table = new Table("TestTable", new EtalonDao());
            table.addField("uuid", uuidField, true);

            assert.throw(function () {
                table.insert();
            }, DBEnvError);
        });

        it("Should return key", function () {
            var table = createTestTable();
            assert.isDefined(table.insert());
        });

        it("Should create and insert row using DAO", function () {
            var table = createTestTable();
            var key = table.insert();

            assert.ok(table.dao.insert.calledOnce);
            var insertedObj = table.dao.insert.firstCall.args[0];
            assert.equal(insertedObj.id, key);
            assert.isDefined(insertedObj.data);
        });

        it("Should cache inserted row", function () {
            var table = createTestTable();
            var key = table.insert();

            var row = table.rows[key];

            assert.isDefined(row);
            assert.deepEqual(row, table.dao.insert.firstCall.args[0]);
        });

        it("Should insert givven data to fields, if provided", function () {
            var data = {data: "SomeUuid"};
            var table = createTestTable();
            var key = table.insert(data);

            assert.equal(table.rows[key].data, data.data);
        });
    });

    describe("cleanUp method", function () {

        it("Should fail on not finalized tables", function () {
            var table = new Table("SomeName", new EtalonDao());
            table.addField("id", uuidField(), true);

            assert.throw(function () {
                table.cleanup();
            }, DBEnvError);
        });

        it("Should cleanup table with data", function () {
            var table = createTestTable();
            table.insert();
            table.cleanup();

            assert.ok(table.dao.delete.calledOnce);
        });

        it("Should cleanup cache", function () {
            var table = createTestTable();
            table.insert();
            table.cleanup();

            assert.deepEqual(table.rows, {});
        });

        it("Should not touch DAO if empty", function () {
            var table = createTestTable();
            table.cleanup();

            assert.ok(table.dao.delete.notCalled);
        });

    });

    describe("setKey method", function () {

        it("Should fail if table finalized", function () {
            var table = createTestTable();
            assert.throw(function () {
                table.setKey("data");
            }, DBEnvError);
        });

        it("Should fail if keyfield is absent", function () {
            var table = new Table("SomeName", new EtalonDao());
            table.addField("id", uuidField());
            assert.throw(function () {
                table.setKey("uuid");
            }, DBEnvError);
        });

        it("Should set key field correctly", function () {
            var table = new Table("SomeName", new EtalonDao());
            table.addField("id", uuidField());
            table.setKey("id");
            assert.equal(table.key, "id");
        });

    });

    describe("getRow method", function () {

        it("Should fail on not finalized table", function () {
            var table = new Table("Name", new EtalonDao());
            assert.throw(function () {
                table.getRow("SomeKey");
            }, DBEnvError);
        });

        it("Should return copy of row by demand", function () {
            var table = createTestTable();
            var key = table.insert();
            var baseRow = table.rows[key];
            var row = table.getRow(key);

            assert.notEqual(row, baseRow);
            assert.deepEqual(row, baseRow);
        });

        it("Should return part of row due to fields param", function () {
            var table = createTestTable();
            var key = table.insert();
            var baseRow = {data: table.rows[key].data};
            var row = table.getRow(key, ["data"]);
            assert.deepEqual(row, baseRow);
        });

        it("Should return undefined on empty row", function () {
            var table = createTestTable();
            assert.isUndefined(table.getRow("SomeKey"));
        });

        it("Should populate if demanded row", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", uuidField(), true)
                .addField("data", uuidField())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", uuidField(), true)
                .addField("mother", dependencyField(mother))
                .finalize();
            var key = daughter.insert();
            var row = daughter.getRow(key, false, true);
            var etalon = daughter.getRow(key);
            etalon.mother = mother.getRow(etalon.mother);
            assert.deepEqual(row, etalon);
        });

        /*it("Should pass parameters down to dependent tables", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", uuidField(), true)
                .addField("data", uuidField())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", uuidField(), true)
                .addField("mother", dependencyField(mother))
                .finalize();
            var grandDaughter =
        })*/
    });

    describe("hasRow method", function () {

        it("Should return false if row not found", function () {
            var table = createTestTable();
            assert.isFalse(table.hasRow("SomeKey"));
        });

        it("Should return true if row found", function () {
            var table = createTestTable();
            var key = table.insert();
            assert.isTrue(table.hasRow(key));
        });

    });

    describe("finalize method", function () {

        it("Should throw error if finalized already", function () {
            var table = createTestTable();
            assert.throw(function () {
                table.finalize();
            }, DBEnvError);
        });

        it("Should throw error if there is no fields", function () {
            var table = new Table("Name", new EtalonDao());
            assert.throw(function () {
                table.finalize();
            }, DBEnvError);
        });

        it("Should throw error if there is no key field", function () {
            var table = new Table("Name", new EtalonDao());
            table.addField("uuid", uuidField());
            assert.throw(function () {
                table.finalize();
            }, DBEnvError);
        });

        it("Should finalize table correctly", function () {
            var table = new Table("Name", new EtalonDao());
            table.addField("uuid", uuidField(), true).finalize();
            assert.ok(table.finalized);
        });

    });
});