var Table = require("../table");
var DBEnvError = require("../errors");

module.exports = function (table) {

    if (!table || !(table instanceof Table)) {
        throw new DBEnvError("Expect Table instance as parameter");
    }

    var result = function (value) {
        if (arguments.length === 0) {
            return table.insert();
        }
        var key = value[table.key];
        if (value.hasOwnProperty(table.key) && table.hasRow(key)) {
            var fields = Object.keys(value);
            var row = table.getRow(key, fields);
            if (fields.some(function (field) {
                    return row[field] != value[field];
                })) {
                throw new DBEnvError("Dependency demands to write data to existent key: \n" + JSON.stringify(value, null, '  '));
            }
            return key;
        }
        return table.insert(value)
    };
    result.dependency = table;
    return result;
};