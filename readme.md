# Eslahan is a DB environment constructor for performing tests.
## Philosophy

Eslahan's main task is to simplify the process of DB preparation for testing scenarios. It allows to avoid large generalized DB conditions, which may make tests implicitly dependant. With the help of Eslahan you can describe DB structure once and insert needed data only, ignoring data not important at the given testing scenario. Eslahan will fill in all other fields according to rules specified by user.

## Installation

    npm i mormehtar/eslahan --save-dev

## Usage

Usage examples can be seen in tests. For example:

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var fields = require("eslahan/fields");

    var DBEnv = require("eslahan");

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

We've got a system of 4 tables, where `mother` and `grandFather` tables consist of single (key) column `id` each, defined within Eslahan as UUID.
`father` table depends on `grandFather` table via `grandFather` field, and contains a key field `id` that also is defined as UUID.
`daughter` table depends on `father` and `mother` tables via `father` and `mother` fields respectively, and contains a key field `id` that, again, is defined as UUID.
Now, when we have described DB structure, we are able to generate easily a couple of stepsisters:

    var daughterTable = env.getTable("daughter");
    var sister1 = daughterTable.insert();
    var sister2 = daughterTable.insert(daughterTable.getRow(sister1, {fields: ["father"]}));

Now we've got a couple of sisters who share one father (and one grandfather) but are born from different mothers.
If we wish, we can generate their cousin who will share a grandfather with them, being born from different parents:

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
Eslahan was created on the assumption of using `Zatanna` or any other DAO offering `insert` and `delete` methods.
There are two key requirements one should mind when using Eslahan. First is, DAO methods should be synchronous and user has to execute async part himself right when it's needed, while the second point is that DAO must not depend on DB scripts (for example, on sequence generators).
The first requirement is fulfilled easily by wrapping DAO methods with accumulators, while the second one can be walked around by generating sequences through JavaScript (with the help of matching field generators within Eslahan).
By default, Eslahan takes inserted DAO as dictionary of table DAOs. However, you can delegate to Eslahan a function of table DAO choosing.

    var env = new DBEnv(new TableDao(), function (tableName, dao) {
        return dao;
    });