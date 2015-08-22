var assert = require("chai").assert;
var sinon = require("sinon");
var EtalonDao = require("./testHelpers").tableDao;

var Table = require("../table");

var uuidField = require("../fields/uuid");
var fields = require("../fields");
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
            var generator = fields.uuid();
            var generatorKey = fields.uuid();
            var generator2 = fields.uuid();

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
            table.addField("id", fields.uuid(), true);
            table.finalize();

            assert.throw(function () {
                table.addField("id2", fields.uuid());
            }, DBEnvError);
        });
    });

    describe("insert method", function () {

        it("Should fail if table is not finalized", function () {
            var table = new Table("TestTable", new EtalonDao());
            table.addField("uuid", fields.uuid(), true);

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

        it("Should insert given data to fields, if provided", function () {
            var data = {data: "SomeUuid"};
            var table = createTestTable();
            var key = table.insert(data);

            assert.equal(table.rows[key].data, data.data);
        });

        it("Should call plugins", function () {
            var plugin = sinon.spy();
            var table = createTestTable().addPlugin("plugin", plugin);

            var key = table.insert();

            assert.ok(plugin.calledOnce);
            assert.deepEqual(plugin.firstCall.thisValue, table);
            assert.equal(plugin.firstCall.args[0], key);
        });

        it("Should pass arguments to plugins", function () {
            var plugin = sinon.spy();
            var table = createTestTable().addPlugin("plugin", plugin).addPlugin("otherPlugin", plugin);

            var key = table.insert({plugin:"someData", otherPlugin:"someOtherData"});

            assert.ok(plugin.calledTwice);
            assert.deepEqual(plugin.firstCall.thisValue, table);
            assert.deepEqual(plugin.secondCall.thisValue, table);
            assert.ok(plugin.calledWithExactly(key, "someData"));
            assert.ok(plugin.calledWithExactly(key, "someOtherData"));
        });
    });

    describe("cleanUp method", function () {

        it("Should fail on not finalized tables", function () {
            var table = new Table("SomeName", new EtalonDao());
            table.addField("id", fields.uuid(), true);

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
            table.addField("id", fields.uuid());
            assert.throw(function () {
                table.setKey("uuid");
            }, DBEnvError);
        });

        it("Should set key field correctly", function () {
            var table = new Table("SomeName", new EtalonDao());
            table.addField("id", fields.uuid());
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
            var row = table.getRow(key, {fields: ["data"]});
            assert.deepEqual(row, baseRow);
        });

        it("Should return undefined on empty row", function () {
            var table = createTestTable();
            assert.isUndefined(table.getRow("SomeKey"));
        });

        it("Should populate if demanded row", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(mother))
                .finalize();
            var key = daughter.insert();
            var row = daughter.getRow(key, {populated: true});
            var etalon = daughter.getRow(key);
            etalon.mother = mother.getRow(etalon.mother);
            assert.deepEqual(row, etalon);
        });

        it("Should populate if has multi dependency", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", fields.uuid(), true)
                .addField("mothers", fields.multiDependency(mother, "data"))
                .finalize();
            var key = daughter.insert();
            var etalon = daughter.getRow(key, {fields:["mothers"]});
            etalon.mothers = mother.getRowsByIndex("data", etalon.mothers, {fields:["id"]});
            assert.deepEqual(daughter.getRow(key, {fields:[{name: "mothers", fields:["id"]}], populated: true}), etalon);
        });

        it("Should not populate dependent tables without demand", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(mother))
                .finalize();
            var grandDaughter = new Table("Granddaughter", new EtalonDao());
            grandDaughter
                .addField("id", fields.uuid(), true)
                .addField("daughter", fields.dependency(daughter))
                .finalize();
            var key = grandDaughter.insert();
            var row = grandDaughter.getRow(key, {populated: true});
            var etalon = grandDaughter.getRow(key);
            etalon.daughter = daughter.getRow(etalon.daughter);
            assert.deepEqual(row, etalon);
        });

        it("Should populate tables right even if null", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(mother))
                .finalize();
            var grandDaughter = new Table("Granddaughter", new EtalonDao());
            grandDaughter
                .addField("id", fields.uuid(), true)
                .addField("daughter", fields.dependency(daughter))
                .finalize();
            var key = grandDaughter.insert({daughter:null});
            var row = grandDaughter.getRow(key, {populated: true});
            var etalon = grandDaughter.getRow(key);
            assert.deepEqual(row, etalon);
        });

        it("Should pass parameters down to dependant tables", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(mother))
                .finalize();
            var grandDaughter = new Table("Granddaughter", new EtalonDao());
            grandDaughter
                .addField("id", fields.uuid(), true)
                .addField("daughter", fields.dependency(daughter))
                .finalize();
            var key = grandDaughter.insert();
            var row = grandDaughter.getRow(
                key,
                {
                    fields:[
                        {
                            name:"daughter",
                            fields:[
                                {
                                    name: "mother",
                                    fields:["data"]
                                }
                            ],
                            populated: true
                        }
                    ],
                    populated: true
                }
            );
            var etalon = grandDaughter.getRow(key, {fields:["daughter"]});
            etalon.daughter = daughter.getRow(etalon.daughter, {fields:["mother"]});
            etalon.daughter.mother = mother.getRow(etalon.daughter.mother, {fields:["data"]});
            assert.deepEqual(row, etalon);
        });
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
            table.addField("uuid", fields.uuid());
            assert.throw(function () {
                table.finalize();
            }, DBEnvError);
        });

        it("Should finalize table correctly", function () {
            var table = new Table("Name", new EtalonDao());
            table.addField("uuid", fields.uuid(), true).finalize();
            assert.ok(table.finalized);
        });
    });

    describe("addIndex method", function () {
        it("Should throw error if there is no field in table", function () {
            var table = new Table("Name", new EtalonDao());
            assert.throw(function () {
                table.addIndex("SomeField");
            }, DBEnvError);
        });

        it("Should create indexes field for field", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .addIndex("data")
                .finalize();
            var key = table.insert();
            assert.deepEqual([key], table.indexes["data"][table.rows[key].data]);
        });

        it("Should add indexes consistently for already inserted indexes", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var key = table.insert();
            table.addIndex("data");
            assert.deepEqual(table.indexes["data"][table.rows[key].data], [key]);
        });
    });

    describe("dropIndex method", function () {
        it("Should throw error if fieldName is absent", function () {
            var table = new Table("Name", new EtalonDao());
            assert.throw(function () {
                table.dropIndex("SomeField");
            }, DBEnvError);
        });

        it("Should cleanup deleted index and preven it renewing", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .addIndex("data")
                .finalize();
            table.insert();
            table.dropIndex("data");
            table.insert();
            assert.isUndefined(table.indexes["data"]);
        });
    });

    describe("getRowsByIndex", function () {
        it("Should throw error if there is no index", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            assert.throw(function () {
                table.getRowsByIndex("data", 0);
            }, DBEnvError);
        });

        it("Should return empty array if there is no data for value", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .addIndex("data")
                .finalize();
            var result = table.getRowsByIndex("data", 0);
            assert.deepEqual(result, []);
        });

        it("Should return rows by index", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .addIndex("data")
                .finalize();
            var key1 = table.insert({data: 1});
            var key2 = table.insert({data: 1});
            table.insert({data: 2});
            assert.deepEqual(table.getRowsByIndex("data", 1), [{id: key1, data:1}, {id:key2, data:1}]);
        });

        it("Should return rows by index populated", function () {
            var mother = new Table("Mother", new EtalonDao());
            mother
                .addField("id", fields.uuid(), true)
                .addField("data", fields.uuid())
                .finalize();
            var daughter = new Table("Daughter", new EtalonDao());
            daughter
                .addField("id", fields.uuid(), true)
                .addField("mother", fields.dependency(mother))
                .addField("data", fields.uuid())
                .addIndex("data")
                .finalize();
            var key1 = daughter.insert({data: 1});
            var key2 = daughter.insert({data: 1});
            daughter.insert({data: 2});
            var element1 = daughter.getRow(key1, {fields: ["id", {name: "mother", fields:["data"]}], populated: true});
            var element2 = daughter.getRow(key2, {fields: ["id", {name: "mother", fields:["data"]}], populated: true});
            var result = daughter.getRowsByIndex("data", 1, {fields: ["id", {name: "mother", fields:["data"]}], populated: true});
            assert.deepEqual(result, [element1, element2]);
        });
    });

    describe("addPlugin method", function () {
        it("Should add plugin", function () {
            var table = new Table("Name", new EtalonDao());
            var plugin = function () {};
            table.addPlugin("SomePlugin", plugin);
            assert.equal(table.plugins.SomePlugin, plugin);
            assert.sameMembers(table.pluginsNames, ["SomePlugin"]);
        });

        it("Should not allow add one plugin twice", function () {
            var table = new Table("Name", new EtalonDao());
            table.addPlugin("plugin", function () {});
            assert.throw(function () {
                table.addPlugin("plugin", function () {});
            }, DBEnvError);
        });
    });

    describe("deletePlugin method", function () {
        it("Should throw error if there is no plugin", function () {
            var table = new Table("Name", new EtalonDao());
            assert.throw(function () {
                table.deletePlugin("plugin", function () {});
            }, DBEnvError);
        });

        it("Should clean up all tracks of plugin", function () {
            var table = new Table("Name", new EtalonDao());
            table
                .addPlugin("SomePlugin", function () {})
                .deletePlugin("SomePlugin");
            assert.deepEqual(table.plugins, {});
            assert.sameMembers(table.pluginsNames, []);
        });
    });
});