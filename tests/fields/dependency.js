var assert = require("chai").assert;
var Table = require("../../table");
var EtalonDao = require("../testHelpers").tableDao;
var DBEnvError = require("../../errors");

var fields = require("../../fields");
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
});
