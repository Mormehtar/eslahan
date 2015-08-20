var Table = require("../table");
var DBEnvError = require("../errors");

var baseGenerator = require("./utils/baseGenerator");

module.exports = function (table, fieldName, options) {
    if (!table || !(table instanceof Table)) {
        throw new DBEnvError("Expect Table instance as parameter");
    }
    if (fieldName === table.key) {
        throw new DBEnvError("Can`t make multiDependency on key value");
    }
    table.addIndex(fieldName);

    var defaults = {
        from: 2,
        to: 8
    };

    var generate = function (options) {
        return function (value) {
            if (value === null) {
                return null;
            }
            var number = Math.floor(Math.random() * (options.to - options.from + 1)) + options.from;
            var data;
            if (arguments.length === 0) {
                if (number === 0) {
                    return null;
                }
                var first = table.insert();
                data = table.getRow(first, {fields: [fieldName]});
                --number;
            } else {
                data = {};
                data[fieldName] = value;
            }
            while (number--) {
                table.insert(data);
            }
            return data[fieldName];
        }
    };

    var specificGenerator = function (options) {
        var generator = generate(options);
        return function () {
            return generator();
        };
    };

    var converterGenerator = function (options) {
        var generator = generate(options);
        return function (value) {
            if (!Array.isArray(value)) {
                if (table.getRowsByIndex(fieldName, value, {fields:[]}).length === 0) {
                    return generator(value);
                }
                return value;
            }
            if (value.length === 0) {
                return null;
            }
            var fieldValue = value.reduce(function (prev, now) {
                if (now.hasOwnProperty(fieldName)) {
                    if (prev === null) {
                        return now[fieldName];
                    }
                    if (now[fieldValue] !== prev) {
                        throw new DBEnvError("Multi dependency field has different dependency field values");
                    }
                }
                return prev;
            }, null);
            var now, element;
            if (fieldValue === null) {
                now = value.length - 1;
                var first = table.insert(value[now]);
                fieldValue = table.getRow(first, {fields:[fieldName]})[fieldName];
                while(now--) {
                    element = value[now];
                    element[fieldName] = fieldValue;
                    table.insert(element);
                }
                return fieldValue;
            } else {
                var knownElements = table.getRowsByIndex(fieldName, fieldValue);
                if (knownElements.length === 0) {
                    now = value.length;
                    while(now--) {
                        element = value[now];
                        element[fieldName] = fieldValue;
                        table.insert(element);
                    }
                    return fieldValue;
                }
                if (value.length !== knownElements.length) {
                    throw new DBEnvError ("Present and given values length mismatch");
                }
                now = value.length;
                while (now--) {
                    var nowValue = value[now];
                    if (!Object.keys(nowValue).every(function (valueFieldName) {
                            var checkElement = nowValue[valueFieldName];
                            return knownElements.some(function (knownElement) {
                                return knownElement[valueFieldName] === checkElement;
                            });
                        })) {
                        throw new DBEnvError ("There are some elements that not represented in value for multi dependency");
                    }
                }
                return fieldValue;
            }
        };
    };

    var result = baseGenerator({
        options: options,
        defaults: defaults,
        specificGenerator: specificGenerator,
        converterGenerator:converterGenerator
    });
    result.dependency = table;
    result.field = fieldName;
    return result;
};