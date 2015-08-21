var Table = require("../table");
var DBEnvError = require("../errors");

var baseGenerator = require("./utils/baseGenerator");

module.exports = function (table, options) {
    if (!table || !(table instanceof Table)) {
        throw new DBEnvError("Expect Table instance as parameter");
    }

    var specificGenerator = function () {
        return table.insert.bind(table);
    };

    var converterGenerator = function () {
        return function (value) {
            if (value == null) {
                return null;
            }
            var _value = {};
            if (!(typeof value === "object")) {
                _value[table.key] = value;
            } else {
                _value = value;
            }
            var key = _value[table.key];
            if (_value.hasOwnProperty(table.key) && table.hasRow(key)) {
                var fields = Object.keys(_value);
                var row = table.getRow(key, fields);
                if (fields.some(function (field) {
                        return row[field] != _value[field];
                    })) {
                    throw new DBEnvError("Dependency demands to write data to existent key: \n" + JSON.stringify(value, null, '  '));
                }
                return key;
            }
            return table.insert(value);
        };
    };

    var result = baseGenerator({
        options: options,
        specificGenerator: specificGenerator,
        converterGenerator:converterGenerator
    });
    result.dependency = table;
    return result;
};