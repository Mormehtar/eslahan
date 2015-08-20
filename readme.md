# Eslahan DB environment for tests.
## Philosophy

Main aim of Eslahan is to make preparing of DB for test scenarios as simple as possible to prevent ugly big presets which prevents tests independency.
Due to Eslahan you can describe DB structure once and then insert rows in any time and be shure that you need to pass only needed data and dot pay any attention on any underling data which is not in the light spot at the moment.
Eslahan will create any dependent rows in DB and fill all fields by given rules.

## Installation

    npm i mormehtar/eslahan --save-dev

## Usage

You can see usage in tests. For example:

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var uuidField = require("eslahan/fields/uuid");
    var dependencyField = require("eslahan/fields/dependency");

    var DBEnv = require("eslahan");

    var env = new DBEnv({
        mother: new TableDao(),
        father: new TableDao(),
        daughter: new TableDao(),
        grandFather: new TableDao()
    });
    env.addTable("mother")
        .addField("id", uuidField(), true);
    env.addTable("grandFather", uuidField(), true)
        .addField("id", uuidField(), true);
    env.addTable("father")
        .addField("id", uuidField(), true)
        .addField("grandFather", dependencyField(env.getTable("grandFather")));
    env.addTable("daughter")
        .addField("id", uuidField(), true)
        .addField("mother", dependencyField(env.getTable("mother")))
        .addField("father", dependencyField(env.getTable("father")));
    env.finalize();

Will describe system of four tables `mother` and `grandFather` consists of only one column `id` which is key generated as uuid.
Table `father` depends on `grandFather` through its field `grandFather` and has its own key `id` generated as uuid.
And table `daughter` depending on `mother` and `father` and having its own key `id` generated as uuid.
And now we go to some test scenario and want to create two stepsisters.

    var daughterTable = env.getTable("daughter");
    var sister1 = daughterTable.insert();
    var sister2 = daughterTable.insert(daughterTable.getRow(sister1, {fields: ["father"]}));

And now you have two sisters with one father, one grand father and two different mothers. You have all ids and other.
More than that you can create one other daughter whit the same grandfather and other father:

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

## DAO and DB
Eslahan was written for Zatanna in mind, but any DAO introducing insert method (taking an object to insert) and delete method cleaning table can be used.
There are two things Eslahan counts on - these DAO methods are synchronous and user execute asyncronous part manually exactly when it is needed and DAO does not depends on DB mechanisms like due to id generating.
First demand can be passed by wrapper for methods (accumulator). Second can be walked around if DB allows manual id creating by using fields like uuid or increment.
Eslahan by default thinks that your DAO allows manipulating with tables as with dictionary. Look at previous example.
But you can provide a function that allows choosing. Like that:

    var env = new DBEnv(new TableDao(), function (tableName, dao) {
        return dao;
    });