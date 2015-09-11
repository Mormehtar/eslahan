var Table = require("../main/table");
var DBEnvError = require("../main/error");
var chooseFromRange = require("../utils/chooseFromRange");

var baseGenerator = require("../utils/baseGenerator");

var defaults = {
    dependsOnExistent: false
};

module.exports = function (table, options) {
    if (!table || !(table instanceof Table)) {
        throw new DBEnvError("Expect Table instance as parameter");
    }

    var specificGenerator = function (options) {
        return function () {
            if (options.dependsOnExistent) {
                var keys = table.getAllRows({fields:["id"]});
                var keyLength = keys.length;
                return keyLength? keys[chooseFromRange(0, keyLength - 1)].id : null;
            }
            return table.insert();
        }
    };

    var converterGenerator = function (options) {
        return function (value) {
            if (value == null) {
                return null;
            }
            var _value = {};
            if (!(typeof value === "object") || (value instanceof Date)) {
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
            if (options.dependsOnExistent) {
                throw new DBEnvError("Dependency on existent and specifies data, but not id");
            }
            return table.insert(value);
        };
    };

    var result = baseGenerator({
        options: options,
        defaults: defaults,
        specificGenerator: specificGenerator,
        converterGenerator:converterGenerator
    });
    result.dependency = table;
    return result;
};