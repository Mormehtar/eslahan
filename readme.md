# Eslahan is a DB environment constructor for performing tests.
## Philosophy

Eslahan's main task is to simplify the process of DB preparation for testing scenarios.
It allows to avoid large generalized DB conditions, which may make tests implicitly dependant.
With the help of Eslahan you can describe DB structure once and insert needed data only,
ignoring data not important at the given testing scenario.
Eslahan will fill in all other fields according to rules specified by user.

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

We've got a system of 4 tables, where `mother` and `grandFather` tables consist of single (key) column `id` each,
defined within Eslahan as UUID.

`father` table depends on `grandFather` table via `grandFather` field,
and contains a key field `id` that also is defined as UUID.

`daughter` table depends on `father` and `mother` tables via `father` and `mother` fields respectively,
and contains a key field `id` that, again, is defined as UUID.

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
From **version 2.0.1** Eslahan expects DAO to support `insert`, `delete` and `select` methods.
Where `select` uses promises and returns whole table as array of objects if run without parameters.

There are two key requirements one should mind when using Eslahan. First is, DAO methods should be synchronous and
user has to execute async part himself right when it's needed, except for `select` method used in `saveFixture` functionality **(from version 2.0.0)**,
while the second point is that DAO must not depend on DB scripts (for example, on sequence generators).

The first requirement is fulfilled easily by wrapping DAO methods with accumulators, while the second one can be walked
around by generating sequences through JavaScript (with the help of matching field generators within Eslahan).

By default, Eslahan takes inserted DAO as dictionary of table DAOs. However, you can delegate to Eslahan a function of
table DAO choosing.

    var env = new DBEnv(new TableDao(), function (tableName, dao) {
        return dao;
    });

## Description

### DBEnv object
Accessible via

    var DBEnv = require("eslahan").DBEnv;

Main Eslahan object. Allows to describe system as whole and to manipulate with it. To construct it you must provide DAO
object and (optionally) tableGetter - function choosing table DAO from given DAO. By default Eslahan chooses
`DAO[tableName]` as table DAO. Example can be found below.

    var env = new DBEnv(DAO, tableChooser);

#### DBEnv.addTable(name) -> Table
Method is usable only if Environment is not finalized. Adds new table with given name, choose DAO for it and returns
added table.
#### DBEnv.getTable(name) -> Table
Method returns table with given name if it's exists, or throws exception.
#### DBEnv.finalize()
Method finalizes all created tables, makes all needed preparations inside Environment makes impossible to add or change
tables makes possible to cleanUp tables.
#### DBEnv.cleanUp()
Method says to DAO (synchronously) that all tables can bee cleaned up and defines right order for table cleaning.
#### DBEnv.saveFixture() -> Promise
**(new in version 2.0.0)**

Method says to Eslahan to save DB state in memory for later DB restoring. Method returns `Promise` and is **asynchronous**.
#### DBEnv.setFixture()
**(new in version 2.0.0)**

Method says to Eslahan to restore DB state to that which was when `DBEnv.saveFixture()` has been called. Method is synchronous.
It is strongly recommended to envelope execution plan with transaction. (`dao.execute(true)` in `Zatanna` for example).


### Table object
Accessible via `addTable` and `getTable` methods of `DBEnv` object.

`Table` allows to describe DB table and to manipulate with it.
#### Table.addField(name, generator, key) -> Table
Method allows to add field int not finalized table. You should provide name for field, field generator (could be found
among require("eslahan").fields) and optionally flag of key column.Method is chainable.

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
Method allows to insert data into finalized table and get key of inserted row. Data is optional parameter providing
demands to inserted row or any daughter rows. For example:

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

First insert method create `daughter` with random fields and dependant `mother` with random fields. Second creates
`daughter` with random key and name "Ekaterina" and dependant mother with name "Anastasia".
#### Table.cleanUp()
Commands DAO to clean up table and cleans up cache. Normally should be called by Environment.
#### Table.setKey(name)
Sets given field as key in not finalized table. Normally should not be called manually, and supposed to be called by
Table.addField with key parameter set in true.
#### Table.getRow(key, options) -> rowData
Returns copy of row with given key. Options allow to restrict returning fields, demand to populate dependent fields.
Also options can be passed to populating tables recursively. If we continue previous example, we can:

    var daughterRow1_1 = daughter.getRow(daughter1);
    var daughterRow1_2 = daughter.getRow(daughter1, {fields: ["name", "mother"]);
    var daughterRow2_1 = daughter.getRow(daughter2, {populated: true});
    var daughterRow2_1 = daughter.getRow(daughter2, {fields: [{name: "mother", fields: ["name"]}, "name"], populated: true});

So we'll get `daughter1_1` - all fields of `daughter1` row, and `mother` will be just an `id` of dependent table.

`daughter1_2` will be an object with fields `name` and `mother` where `mother` would be just an `id` of dependent table.

`daughter2_1` will be an object with all fields of `daughter2` row and `mother` is object with copy of all fields of
respective `mother` row.

`daughter2_2` will be equal to ```{name: "Ekaterina", mother: {name: "Anastasia"}}``` due to our demand to inserted
rows.

It's important to remember, that getRow method works with cache and returns initial data which was inserted during
preparation for testing scenario. And it can be used as example control data, not affected by test scenario.
#### Table.hasRow(key) -> boolean
Method returns if there is a row with given key.
#### Table.finalize()
Method finalizes table. Checks if it's consistent restrict constructing methods and allows insert method. Normally it
would be called by DBEnv.finalize() method, but some dependency structures may demand finalization of table before of
finalization of environment.
#### Table.addIndex(fieldName) -> Table
Method mark field as index allowing usage of Table.getRowByIndex method with this field. Can be called before and after
finalization.
#### Table.dropIndex(fieldName) -> Table
qgMethod drops index made by Table.addIndex method and frees memory got by destroyed index.
#### Table.getRowsByIndex(fieldName, fieldValue, options) -> \[rowData...\]
Returns array of rows with field `fieldName` equal to `fieldValue`. If no rows found returns empty array. If `options`
are used in rows extracting identically to Table.getRow options. Only works with fields declared as indexes by
Table.addIndex method.
#### Table.addPlugin(name, plugin) -> Table
Method adds `plugin` to table and gives given `name` to it. Plugins are called after every insert and get table as this,
keyValue of just inserted row and parameters passed to insert method in field equal to `name`.
#### Table.deletePlugin(name) -> Table
Method deletes plugin with given `name`.
#### Table.getAllRows(options) -> \[rowData...\]
**(new in 0.1.7)**

Returns array of all rows in table. If there are no rows, returns empty array. May accept options working identically
to `Table.getRow`.
#### Table.saveFixture() -> Promise
**(new in version 2.0.0)**

Method says to Eslahan to save Table state in memory for later DB restoring. Method returns `Promise` and is **asynchronous**.
#### Table.setFixture()
**(new in version 2.0.0)**

Method says to Eslahan to restore Table state to that which was when `Table.saveFixture()` has been called. Method is synchronous.
It is strongly recommended to envelope execution plan with transaction. (`dao.execute(true)` in `Zatanna` for example).


### Fields
Fields is a collection of field generators for Eslahan. You can use your oun fieldGenerators but Eslahan gives you some
predefined generators. They are available as `eslahan.fields`.

Example of field generators usege can be seen in example for Table.addField method. When generator passed to addField
method it can get options like:

    table.addField("SomeInt", eslahan.fields.int({from: 5, to: 10}));

#### datetime(options) -> fieldGenerator
Defines datetime field. It returns now by default. If only `from` passed, field will be a random datetime from `from` to
now. If only `to` passed, field will be random datetime from now to `to`. If `from` and `to` passed, field will be
random datetime from `from` to `to`.
#### decimal(options) -> fieldGenerator
Defines decimal field. It returns string with number from `from` to `to` with `fractionalDigits` digits after dot. By
default it returns number in trange 0-100 with two digits after dot.
#### dependency(table) -> fieldGenerator
Defines field that depends on other table. If table has dependency to other table, every insert to this table will
cause insertion (if needed and possible) to dependant table. Generator takes table object, to make dependency. You can
look Table.addField example to see usage of dependency field.

**(new in 0.1.8)**

Also `dependsOnExistent` parameter may be given. If it is `true` and no `value` passed to generator, it will return only
existent `id`s or `null`. Generator will ignore `dependsOnExistent` if `value` passed.   
#### email(options) -> fieldGenerator
Defines field with random email. Gets `addressFrom` (default 3), `addressTo` (default 8), `serverFrom` (default 3),
`serverTo` (default 8), `domainFrom` (default 1), `domainTo` (default 3). Field generates email with lengths in ranges
(`addressFrom` - `addressTo`)@(`serverFrom` - `serverTo`).(`domainFrom` - `domainTo`).
#### float(options) -> fieldGenerator
Defines random float point field in range from `from` to `to`. By default 0-100.
#### increment(options) -> fieldGenerator
Defines incrementing field generator returning row of numbers from `from`. From 1 by default. (1, 2, 3)
#### int(options) -> fieldGenerator
Defines integer field. Returns integer in range from `from` to `to`. By default 0-100.
#### multiDependency(table, fieldName, options) -> fieldGenerator
Defines field that depends on many rows of other table. Generates (if needed and possible) from `from` to `to` dependent
rows (2-8 by default). Can pass common elements if value for field is object, or allows to define every daughter element
if value for field is an array.

**Important!**
System doesn't allow to check loop of multi dependency but it is plain and easy way to insert infinite rows by one
insert.

Example:

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var eslahan = require("eslahan");
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

`person1` will insert one `person` and 1-3 `things` with `owner=person1`.

`person2` will insert one `person` and 1-3 `things` and all ow them will have `name="SomeThing"` and `owner=person2`.

`person3` will insert one `person` and two `things` one of them will have `name="Picture"` and other will have
`name="Paintings"` and both of them will have `owner=person3`.

**(new in 0.1.8)**

Also `dependsOnExistent` parameter may be given. If it is `true` and no `value` passed to generator, it will return only
existent `id`s or `null`. Generator will ignore `dependsOnExistent` if `value` passed.
#### text(options) -> fieldGenerator (changed in `0.1.7`)
Defines text field. Returns text of `wordsFrom`-`wordsTo` words divided by `delimiter` of length `wordFrom`-`wordTo` and
consists from symbols in `symbols`. Some predefined symbols strings may be found in `text.symbols`. By default generates
text of one word in latin symbols of length 2-8. Default delimiter is space.
#### uuid() -> fieldGenerator
Defines UUID field. Generating uuid.
#### json() -> fieldGenerator
**(new in 0.1.6)**

Defines JSON field. Returns json string made using `template`. Template is an object, defining objects that may be in
your JSON by default. Default `template` defines JSON of empty string.

`template` consists of fields with objects which may have up to three fields: `probability` describes probability of
this field, if omitted field will be generated always, `generator` describes generator function, or object, describing
template of object in this field, `value` value in this field if `generator` and `field` a both presented in
object - `value` would be passed to `generator`. Also if you don't need `generator` and `probability` and your `value`
not an object - you may path it directly to field.

    var fields = require("eslahan").fields;
    var field = fields.json({
        template: {
            fieldOne: 1,
            fieldTwo: { generator: fields.uuid() },
            fieldThree: { value: 25, probability: 0.5 },
            fieldFour: { generator: fields.uuid(), value: 5 },
            complexField: {
                generator: {
                    fieldFive: 5,
                    fieldSix: { value: 6 }
                }
            }
        }
    });
    var result = field();

Will generate JSON of objects like

    {
        fieldOne: 1,
        fieldTwo: 'Some UUID here',
        fieldThree: 25,
        fieldFour: 5,
        complexField: {
            fieldFive: 5,
            fieldSix: 6
        }
    }

`fieldThree` will appear only in half objects, `fieldTwo` will be some real UUID, `fieldFour` always equal to `5`
because UUID generator passes it. 

### Plugins
Is a collection of plugins for Tables. Plugins allow to make some action on insertion to Table. They are available
by `eslahan.plugins`.
#### oneToManyDependency(baseTable, table, fieldName, options) -> pluginFunction
Describes reversed one to many dependency, when for example one table has dependency on the other (and allows it to be
many to one dependency) but it is easier to insert data int dependent table. For example:

    var TableDao = require("eslahan/tests/testHelpers").tableDao;
    var eslahan = require("eslahan");
    var DBEnv = eslahan.DBEnv;
    var env = new DBEnv(new TableDao(), function (tableName, dao) {
        return dao;
    });

    var user = env.addTable("user");
    user
        .addField("id", eslahan.fields.uuid(), true)
        .finalize();
    var right = env.addTable("right");
    right
        .addField("id", eslahan.fields.uuid(), true)
        .addField("user", eslahan.fields.dependency(user))
        .addField("shortName", eslahan.fields.uuid())
        .finalize();
    user.addPlugin("rights", pluginGenerator(user, right, "user", {from 2, to: 3}));

    var key = user.insert({rights:{shortName:"SomeName"}});
    var elements = right.getRowsByIndex("user", key, {fields:["shortName"]});

Here would be created `user` row and 2-3 `right` rows with `shortName="SomeName"`.
You must pass baseTable to oneToMany plugin just for security checks, it never used in process. It's important not to
allow loop many to one dependency. You can pass values for plugin creating tables passing parameter equal to plugin
name in value object.