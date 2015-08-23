var assert = require("chai").assert;
var Table = require("../../main/table");
var EtalonDao = require("../testHelpers").tableDao;
var eslahan = require("../..");
var DBEnvError = eslahan.DBEnvError;

var fields = eslahan.fields;
var field = fields.multiDependency;

var REPEATS = 100;

var testTable = function () {
    var table = new Table("Name", new EtalonDao());
    table
        .addField("id", fields.uuid(), true)
        .addField("data", fields.uuid())
        .finalize();
    return table;
};

describe("Multi dependency field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        var table = testTable();
        assert.isFunction(field(table, "data"));
    });

    it("Should throw error if table not provided", function () {
        assert.throw(function () {
            field({})
        }, DBEnvError);
    });

    it("Should throw error if row not presented in table", function () {
        var table = new Table("Name", new EtalonDao());
        assert.throw(function () {
            field(table, "data");
        }, DBEnvError);
    });

    it("Should throw error if row is a key in table", function () {
        var table = new Table("Name", new EtalonDao());
        table.addField("id", fields.uuid(), true);
        assert.throw(function () {
            field(table, "id");
        }, DBEnvError);
    });

    it("Should show own dependency", function () {
        var table = testTable();
        var f = field(table, "data");
        assert.equal(f.dependency, table);
    });

    it("Should show own field dependency", function () {
        var table = testTable();
        var f = field(table, "data");
        assert.equal(f.field, "data");
    });

    it("Should create dependent fields", function () {
        var table = testTable();
        var f = field(table, "data");
        for (var i= REPEATS; i--;) {
            table.cleanup();
            var value = f();
            var result = table.getRowsByIndex("data", value).length;
            assert.ok(result >= 2);
            assert.ok(result <= 8);
        }
    });

    it("Should create dependent fields in given range", function () {
        var table = testTable();
        var f = field(table, "data", {from: 3, to:5});
        for (var i= REPEATS; i--;) {
            table.cleanup();
            var value = f();
            var result = table.getRowsByIndex("data", value).length;
            assert.ok(result >= 3);
            assert.ok(result <= 5);
        }
    });

    it("Should not create dependent fields if null is given", function () {
        var table = testTable();
        var f = field(table, "data");
        f(null);
        assert.equal(Object.keys(table.rows).length, 0);
    });

    it("Should create fields with given data", function () {
        var table = testTable();
        var f = field(table, "data");
        var value = f("SomeData");
        assert.equal(value, "SomeData");
        var result = table.getRowsByIndex("data", value).length;
        assert.ok(result >= 2);
        assert.ok(result <= 8);
    });

    it("Should pass data to daughter rows", function () {
        var table = new Table("Name", new EtalonDao());
        table
            .addField("id", fields.uuid(), true)
            .addField("data", fields.uuid())
            .addField("other", fields.uuid())
            .finalize();
        var f = field(table, "data", {from:2, to:2});
        var value = f({other: 1, data:"SomeData"});
        assert.equal(value, "SomeData");
        var result = table.getRowsByIndex("data", value, {fields:["other", "data"]});
        assert.sameDeepMembers(result, [{other: 1, data:"SomeData"}, {other:1, data:"SomeData"}]);
    });

    it("Should pass data to daughter rows by array", function () {
        var table = testTable();
        var f = field(table, "data");
        var value = f([{id: 1, data:"SomeData"}, {id:2}]);
        assert.equal(value, "SomeData");
        var result = table.getRowsByIndex("data", value);
        assert.sameDeepMembers(result, [{id: 1, data:"SomeData"}, {id:2, data:"SomeData"}]);
    });

    it("Should pass data to daughter rows only once if they are the same", function () {
        var table = testTable();
        var f = field(table, "data");
        f([{id: 1, data: "SomeData"}, {id: 2}]);
        var value = f([{id: 1, data: "SomeData"}, {id: 2}]);
        assert.equal(value, "SomeData");
        var result = table.getRowsByIndex("data", value);
        assert.sameDeepMembers(result, [{id: 1, data:"SomeData"}, {id:2, data:"SomeData"}]);
    });

    it("Should pass data to daughter rows only once if they a tha same even if passed y string", function () {
        var table = testTable();
        var f = field(table, "data");
        var value = f([{id: 1, data: "SomeData"}, {id: 2}]);
        value = f(value);
        assert.equal(value, "SomeData");
        var result = table.getRowsByIndex("data", value);
        assert.sameDeepMembers(result, [{id: 1, data:"SomeData"}, {id:2, data:"SomeData"}]);
    });

    it("Should throw error if inconsistent fields are given", function () {
        var table = testTable();
        var f = field(table, "data");
        f([{id: 1, data: "SomeData"}, {id: 2}]);
        assert.throw(function () {
            f([{id: 1, data: "SomeData"}, {id: 3}]);
        }, DBEnvError);
    });

    it("Should throw if different number of elements are given", function () {
        var table = testTable();
        var f = field(table, "data");
        f([{id: 1, data: "SomeData"}, {id: 2}]);
        assert.throw(function () {
            f([{id: 1, data: "SomeData"}, {id: 2}, {id: 3}]);
        }, DBEnvError);
    });

    it("Should generate field value if can`t find it", function() {
        var table = testTable();
        var f = field(table, "data");
        var value = (f([{id: 1}, {id: 2}]));
        var result = table.getRowsByIndex("data", value);
        assert.sameDeepMembers(result, [{id: 1, data:value}, {id:2, data:value}]);
    });
});