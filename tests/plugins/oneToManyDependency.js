var assert = require("chai").assert;
var Table = require("../../table");

var uuidField = require("../../fields/uuid");
var dependencyField = require("../../fields/dependency");
var multiDependencyField = require("../../fields/multiDependency");

var DBEnvError = require("../../errors");
var EtalonDao = require("../testHelpers").tableDao;

var pluginGenerator = require("../../plugins/oneToManyDependency");
var REPEATS = 100;

describe.only("One to many dependency plugin", function () {
    it("Should throw error if got not a table", function () {
        assert.throw(function () {
            pluginGenerator({}, new Table("Name", new EtalonDao()), "plugin");
        }, DBEnvError);
        assert.throw(function () {
            pluginGenerator(new Table("Name", new EtalonDao()), {}, "plugin");
        }, DBEnvError);
    });

    it("Should throw error if there is no field in given table", function () {
        var table = new Table("Name", new EtalonDao());
        assert.throw(function () {
            pluginGenerator(table, table, "someField");
        }, DBEnvError);
    });

    it("Should throw error if given field is key field", function () {
        var table = new Table("Name", new EtalonDao());
        table.addField("id", uuidField(), true);
        assert.throw(function () {
            pluginGenerator(table, table, "id");
        }, DBEnvError);
    });

    it("Should throw error if given baseTable is not a table plugin is attached to", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", dependencyField(user))
            .finalize();
        var other = new Table("other", new EtalonDao());
        other
            .addField("id", uuidField(), true)
            .finalize();
        other.addPlugin("rights", pluginGenerator(user, right, "user"));
        assert.throw(function () {
            other.insert();
        }, DBEnvError);
    });

    it("should throw error if given table is not finalized", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", dependencyField(user));
        assert.throw(function () {
            user.addPlugin("rights", pluginGenerator(user, right, "user"));
        }, DBEnvError);
    });

    it("Should throw error if given baseTable has loop multi dependency with given table", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .addField("data", uuidField())
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", multiDependencyField(user, "data"))
            .finalize();
        assert.throw(function () {
            user.addPlugin("rights", pluginGenerator(user, right, "user"));
        }, DBEnvError);
    });

    it("Should create 1-3 daughter rows by default", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", dependencyField(user))
            .finalize();
        user.addPlugin("rights", pluginGenerator(user, right, "user"));
        for (var i = REPEATS; i--;){
            var length = right.getRowsByIndex("user", user.insert()).length;
            assert.ok(length >= 1 && length <= 3, "Plugin created wrong number of daughter rows: " + length);
        }
    });

    it("Should create daughter rows in given range", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", dependencyField(user))
            .finalize();
        user.addPlugin("rights", pluginGenerator(user, right, "user", {from: 2, to: 4}));
        for (var i = REPEATS; i--;){
            var length = right.getRowsByIndex("user", user.insert()).length;
            assert.ok(length >= 2 && length <= 4, "Plugin created wrong number of daughter rows: " + length);
        }
    });

    it("Should pass data to daughter rows", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", dependencyField(user))
            .addField("shortName", uuidField())
            .finalize();
        user.addPlugin("rights", pluginGenerator(user, right, "user"));
        for (var i = REPEATS; i--;){
            var elements = right.getRowsByIndex("user", user.insert({rights:{shortName:"SomeName"}}), {fields:["shortName"]});
            elements.forEach(function (element) {
                assert.deepEqual(element, {shortName:"SomeName"});
            });
        }
    });

    it("Should pass data for every daughter row if data given", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", dependencyField(user))
            .addField("shortName", uuidField())
            .finalize();
        user.addPlugin("rights", pluginGenerator(user, right, "user"));
        var elements = right.getRowsByIndex(
            "user",
            user.insert(
                {
                    rights:[
                        {shortName:"SomeName"},
                        {shortName:"SomeOtherName"}
                    ]
                }),
            {fields:["shortName"]}
        );
        assert.sameDeepMembers(elements, [
            {shortName:"SomeName"},
            {shortName:"SomeOtherName"}
        ]);
    });

    it("Should change nothing if daughter rows exist already and no data given", function () {
        var user = new Table("user", new EtalonDao());
        user
            .addField("id", uuidField(), true)
            .addField("data", uuidField())
            .finalize();
        var right = new Table("right", new EtalonDao());
        right
            .addField("id", uuidField(), true)
            .addField("user", uuidField())
            .finalize();
        user.addPlugin("rights", pluginGenerator(user, right, "user"));
        var key = right.insert({user:"SomeUser"});
        var elements = right.getRowsByIndex(
            "user",
            user.insert({id:"SomeUser"})
        );
        assert.sameDeepMembers(elements, [right.getRow(key)]);
    });
});