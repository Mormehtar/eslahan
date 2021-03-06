var assert = require("chai").assert;

describe("Read me example 1", function () {
    it("Should create stepsisters and cuisine", function () {
        var TableDao = require("../testHelpers").tableDao;
        var eslahan = require("../..");
        var fields = eslahan.fields;
        var DBEnv = eslahan.DBEnv;

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

        var daughterTable = env.getTable("daughter");
        var sister1 = daughterTable.insert();
        var sister2 = daughterTable.insert(daughterTable.getRow(sister1, {fields: ["father"]}));

        assert.lengthOf(Object.keys(daughterTable.rows), 2);
        assert.lengthOf(Object.keys(env.getTable("mother").rows), 2);
        assert.lengthOf(Object.keys(env.getTable("father").rows), 1);
        assert.lengthOf(Object.keys(env.getTable("grandFather").rows), 1);

        var daughter = daughterTable.insert(
            daughterTable.getRow(
                sister1,
                {
                    fields: [
                        {
                            name: "father",
                            fields: ["grandFather"]
                        }
                    ],
                    populated: true
                }
            )
        );

        assert.lengthOf(Object.keys(daughterTable.rows), 3);
        assert.lengthOf(Object.keys(env.getTable("mother").rows), 3);
        assert.lengthOf(Object.keys(env.getTable("father").rows), 2);
        assert.lengthOf(Object.keys(env.getTable("grandFather").rows), 1);

    });
});