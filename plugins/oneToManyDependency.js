var Table = require("../table");
var DBEnvError = require("../errors");
var chooseFromRange = require("../fields/utils/chooseFromRange");

var defaults = {
    from: 1,
    to: 3
};

module.exports = function (baseTable, table, fieldName, options) {
    if (!table || !(table instanceof Table)) {
        throw new DBEnvError("Expect Table instance as table parameter");
    }
    if (!table.finalized) {
        throw new DBEnvError("Can't make oneToManyDependency to not finalized table");
    }
    if (!baseTable || !(baseTable instanceof Table)) {
        throw new DBEnvError("Expect Table instance as baseTable parameter");
    }
    if (fieldName === table.key) {
        throw new DBEnvError("Can`t make one to many dependency on key value");
    }
    var field = table.fields[fieldName];
    if (!field) {
        throw new DBEnvError("There is no field " + fieldName + " in dependant table");
    }
    if (
        field.dependency &&
        baseTable === field.dependency &&
        Object.keys(table.fields).some(function (fieldName) {
            return table.fields[fieldName].field && table.fields[fieldName].field != baseTable.key
        })) {
        throw new DBEnvError("There is dangerous back dependency in DB structure, check tables " + baseTable.name + " and " + table.name);
    }

    table.addIndex(fieldName);

    options = options || {};
    var _options = Object.keys(defaults).reduce(function (obj, key) {
        if (!options.hasOwnProperty(key)) {
            obj[key] = defaults[key];
        } else {
            obj[key] = options[key];
        }
        return obj;
    }, {});

    function insertNewRows(baseValue, value, number) {
        var insertValue = value || {};
        insertValue[fieldName] = baseValue;
        var _number = number !== undefined ? number : chooseFromRange(_options.from, _options.to);
        for (var i = _number; i--;) {
            table.insert(insertValue);
        }
    }

    return function (baseValue, value) {
        if (this != baseTable) {
            throw new DBEnvError("Plugin was called with some other table than created");
        }
        var existentElements;
        var valueKeys;
        var error;
        var i;
        if (value === undefined) {
            existentElements = table.getRowsByIndex(fieldName, baseValue, {fields: []});
            if (existentElements.length) {
                return;
            }
            return insertNewRows(baseValue);
        }
        if (!Array.isArray(value)) {
            valueKeys = Object.keys(value);
            existentElements = table.getRowsByIndex(fieldName, baseValue, {fields: valueKeys});
            if (!existentElements.length) {
                return insertNewRows(baseValue, value);
            }
            if (!existentElements.every(function (element) {
                    return valueKeys.every(function (key) {
                        return value[key] == element[key];
                    });
                })) {
                error = new DBEnvError("Mismatch found between inserting and existent rows in One to many dependency.");
                error.inserting = value;
                error.existent = existentElements;
                throw error;
            }
            return;
        }
        existentElements = table.getRowsByIndex(fieldName, baseValue);
        if (!existentElements.length) {
            for (i = value.length; i--;) {
                insertNewRows(baseValue, value[i], 1);
            }
            return;
        }
        if (value.length !== existentElements.length) {
            error = new DBEnvError("Mismatch found between inserting and existent rows in One to many dependency.");
            error.inserting = value;
            error.existent = existentElements;
            throw error;
        }
        for (i = value.length; i--;) {
            if (!existentElements.some(function (element) {
                    return Object.keys(value[i]).every(function (key) {
                        return value[i][key] == element[key];
                    });
                })) {
                error = new DBEnvError("Mismatch found between inserting and existent rows in One to many dependency.");
                error.inserting = value[i];
                error.existent = existentElements;
                throw error;
            }
        }
    }
};