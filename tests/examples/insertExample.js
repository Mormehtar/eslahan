var assert = require("chai").assert;
describe("Example for Table.insert method in readme", function () {
    it("Should insert row with provided data into table and dependent table", function () {
        var TableDao = require("../../tests/testHelpers").tableDao;
        var eslahan = require("../..");
        var DBEnv = eslahan.DBEnv;
        var env = new DBEnv(new TableDao(), function (tableName, dao) {
            return dao;
        });
        var mother = env.addTable("Mother")
            .addField("id", eslahan.fields.uuid(), true)
            .addField("name", eslahan.fields.text());
        var daughter = env.addTable("daughter")
            .addField("id", eslahan.fields.uuid(), true)
            .addField("name", eslahan.fields.text())
            .addField("mother", eslahan.fields.dependency(mother));
        env.finalize();

        var daughter1 = daughter.insert();
        var daughter2 = daughter.insert({name: "Ekaterina", mother: {name: "Anastasia"}});

        var daughterRow = daughter.getRow(daughter1);
        assert.isDefined(daughterRow);
        assert.isDefined(mother.getRow(daughterRow.mother));

        daughterRow = daughter.getRow(daughter2, {fields: [{name: "mother", fields: ["name"]}, "name"], populated: true});
        assert.equal(daughterRow.name, "Ekaterina");
        assert.equal(daughterRow.mother.name, "Anastasia");
    });
});