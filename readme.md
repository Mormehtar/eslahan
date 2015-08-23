# Eslahan is a DB environment constructor for performing tests.
## Philosophy

Eslahan's main task is to simplify the process of DB preparation for testing scenarios. It allows to avoid large generalized DB conditions, which may make tests implicitly dependant. With the help of Eslahan you can describe DB structure once and insert needed data only, ignoring data not important at the given testing scenario. Eslahan will fill in all other fields according to rules specified by user.

## Installation

    npm i mormehtar/eslahan --save-dev

## Usage

Usage examples can be seen in tests. For example:

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var eslahan = require("eslahan");
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

## Description

### DBEnv object
Accessible via

    var DBEnv = require("eslahan").DBEnv;

Main Eslahan object. Allows to describe system as whole and to manipulate with it. To construct it you must provide DAO object and (optionally) tableGetter - function choosing table DAO from given DAO. By default Eslahan chooses DAO[tableName] as table DAO. Example can be found below.

    var env = new DBEnv(DAO, tableChooser);

#### DBEnv.addTable(name) -> Table
Method is usable only if Environment is not finalized. Adds new table with given name, choose DAO for it and returns added table.
#### DBEnv.getTable(name) -> Table
Method returns table with given name if it's exists, or throws exception.
#### DBEnv.finalize()
Method finalizes all created tables, makes all needed preparations inside Environment makes impossible to add or change tables makes possible to cleanUp tables.
#### DBEnv.cleanUp()
Method says to DAO (synchronously) that all tables can bee cleaned up and defines right order for table cleaning.

### Table object
Accessible via addTable and getTable methods of DBEnv object.
Table allows to describe DB table and to manipulate with it.
#### Table.addField(name, generator, key) -> Table
Method allows to add field int not finalized table. You should provide name for field, field generator (could be found among require("eslahan").fields) and optionally flag of key column.Method is chainable.

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var eslahan = require("eslahan");
    var DBEnv = eslahan.DBEnv;
    var env = new DBEnv({"NewTable" : new TableDao()});
    var table = env.addTable("NewTable");
    table
        .addField("id", eslahan.fields.uuid(), true)
        .addField("data", eslahan.fields.text());

Creates table `NewTable` with uuid key field `id` and text field `data`.
#### Table.insert(data) -> keyValue
Method allows to insert data into finalized table and get key of inserted row. Data is optional parameter providing demands to inserted row or any daughter rows. For example:

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var eslahan = require("eslahan");
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

First insert method create `daughter` with random fields and dependant `mother` with random fields. Second creates `daughter` with random key and name "Ekaterina" and dependant mother with name "Anastasia".
#### Table.cleanUp()
Commands DAO to clean up table and cleans up cache. Normally should be called by Environment.
#### Table.setKey(name)
Sets given field as key in not finalized table. Normally should not be called manually, and supposed to be called by Table.addField with key parameter set in true.
#### Table.getRow(key, options) -> rowData
Returns copy of row with given key. Options allow to restrict returning fields, demand to populate dependent fields. Also options can be passed to populating tables recursively. If we continue previous example, we can:

    var daughterRow1_1 = daughter.getRow(daughter1);
    var daughterRow1_2 = daughter.getRow(daughter1, {fields: ["name", "mother"]);
    var daughterRow2_1 = daughter.getRow(daughter2, {populated: true});
    var daughterRow2_1 = daughter.getRow(daughter2, {fields: [{name: "mother", fields: ["name"]}, "name"], populated: true});

So we'll get `daughter1_1` - all fields of `daughter1` row, and `mother` will be just an `id` of dependent table.
`daughter1_2` will be an object with fields `name` and `mother` where `mother` would be just an `id` of dependent table.
`daughter2_1` will be an object with all fields of `daughter2` row and `mother` is object with copy of all fields of respective `mother` row.
`daughter2_2` will be equal to ```{name: "Ekaterina", mother: {name: "Anastasia"}}``` due to our demand to inserted rows.
It`s important to remember, that getRow method works with cache and returns initial data which was inserted during preparation for testing scenario. And it can be used as example control data, not affected by test scenario.
#### Table.hasRow(key) -> boolean
Method returns if there is a row with given key.
#### Table.finalize()
Method finalizes table. Checks if it's consistent restrict constructing methods and allows insert method. Normally it would be called by DBEnv.finalize() method, but some dependency structures may demand finalization of table before of finalization of environment.
#### Table.addIndex(fieldName) -> Table
Method mark field as index allowing usage of Table.getRowByIndex method with this field. Can be called before and after finalization.
#### Table.dropIndex(fieldName) -> Table
Method drops index made by Table.addIndex method and frees memory got by destroyed index.
#### Table.getRowsByIndex(fieldName, fieldValue, options) -> [rowData...]
Returns array of rows with field `fieldName` equal to `fieldValue`. If no rows found returns empty array. If `options` are used in rows extracting identically to Table.getRow options. Only works with fields declared as indexes by Table.addIndex method.
#### Table.addPlugin(name, plugin) -> Table
Method adds `plugin` to table and gives given `name` to it. Plugins are called after every insert and get table as this, keyValue of just inserted row and parameters passed to insert method in field equal to `name`.
#### Table.deletePlugin(name) -> Table
Method deletes plugin with given `name`.