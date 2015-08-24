var assert = require("chai").assert;
describe("Example for multi dependency in readme", function () {
    it("Should insert rows with provided data into table and dependent table", function () {
        var TableDao = require("../../tests/testHelpers").tableDao;
        var eslahan = require("../..");
        var DBEnv = eslahan.DBEnv;
        var env = new DBEnv(new TableDao(), function (tableName, dao) {
            return dao;
        });
        var things = env.addTable("Things")
            .addField("id", eslahan.fields.uuid(), true)
            .addField("name", eslahan.fields.text())
            .addField("owner", eslahan.fields.uuid());
        var person = env.addTable("person")
            .addField("id", eslahan.fields.multiDependency(things, "owner", {from: 1, to: 3}), true)
            .addField("name", eslahan.fields.text());
        env.finalize();

        var person1 = person.insert();
        var person2 = person.insert({id:{name:"SomeThing"}});
        var person3 = person.insert({id:[{name:"Picture"}, {name:"Paintings"}]});

        var things1 = things.getRowsByIndex("owner", person1, {fields:[]});
        assert.ok(things1.length>=1);
        assert.ok(things1.length<=3);
        var things2 = things.getRowsByIndex("owner", person2, {fields:["name"]});
        assert.ok(things1.length>=1);
        assert.ok(things1.length<=3);
        var res = [];
        for (var i = 0; i<things2.length; ++i) {res.push({name:"SomeThing"});}
        assert.sameDeepMembers(things2, res);
        var things3 = things.getRowsByIndex("owner", person3, {fields:["name"]});
        assert.sameDeepMembers(things3, [{name:"Picture"}, {name:"Paintings"}]);
    });
});