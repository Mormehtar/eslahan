var assert = require("chai").assert;
describe("Example for Table.addField method in readme", function () {
    it("Should create table with 2 fields", function () {
        var TableDao = require("../../tests/testHelpers").tableDao;
        var eslahan = require("../..");
        var DBEnv = eslahan.DBEnv;
        var env = new DBEnv({"NewTable" : new TableDao()});
        var table = env.addTable("NewTable");
        table
            .addField("id", eslahan.fields.uuid(), true)
            .addField("data", eslahan.fields.text());

        assert.equal(table.key, "id");
        assert.sameMembers(Object.keys(table.fields), ["id", "data"]);
    });
});