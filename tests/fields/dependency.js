var assert = require("chai").assert;
var Table = require("../../main/table");
var EtalonDao = require("../testHelpers").tableDao;
var eslahan = require("../..");
var DBEnvError = eslahan.DBEnvError;

var fields = eslahan.fields;
var field = fields.dependency;

describe("Dependency field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        var table = new Table("Name", new EtalonDao());
        assert.isFunction(field(table));
    });

    it("Should throw error if table not provided", function () {
        assert.throw(function () {
            field({})
        }, DBEnvError);
    });

    it("Should show own dependency", function () {
        var table = new Table("Name", new EtalonDao());
        var f = field(table);
        assert.equal(f.dependency, table);
    });

    it("Should create row in dependent table", function () {
        var table = new Table("Name", new EtalonDao());
        table.addField("id", fields.uuid(), true).finalize();
        var f = field(table);
        var key = f();
        assert.ok(table.hasRow(key));
    });

    it("Should create row in dependent table with provided data", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var f = field(table);
        var key = f({data:"SomeData"});
        assert.equal(table.getRow(key).data, "SomeData");
    });

    it("Should use row if it present already", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var f = field(table);
        var key = table.insert();
        var k = f({id: key});
        assert.equal(k, key);
        assert.lengthOf(Object.keys(table.rows), 1);
    });

    it("Should throw error if non key data try to be overwritten", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var f = field(table);
        var key = table.insert();
        assert.throw(function () {
            f({id:key, data:"SomeData"});
        }, DBEnvError);
    });

    it("Should be transitional", function () {
        var mother = new Table("Mother", new EtalonDao());
        mother
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var daughter = new Table("Daughter", new EtalonDao());
        daughter
            .addField("id", fields.uuid(), true)
            .addField("mother", field(mother))
            .finalize();

        var f = field(daughter);
        var key = f({mother:{data:"SomeData"}});
        var row = mother.getRow(daughter.getRow(key, ["mother"]).mother, ["data"]);
        assert.equal(row.data, "SomeData");
    });

    it("Should create row with given id if it doesn't exists", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var f = field(table);
        var key = f({id: "abra"});

        assert.equal(key, "abra");
        assert.deepEqual(table.getRow("abra", {fields:[]}), {});
    });

    it("Should return null if depend on existent given and there is no rows", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var f = field(table, {dependsOnExistent: true});
        var key = f();

        assert.isNull(key);
        assert.lengthOf(Object.keys(table.rows), 0);
    });

    it("Should return existent key if depend on existent given", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .finalize();
        var key1 = table.insert();
        var f = field(table, {dependsOnExistent: true});
        var key = f();

        assert.equal(key, key1);
        assert.lengthOf(Object.keys(table.rows), 1);
    });

});
