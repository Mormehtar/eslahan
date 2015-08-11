module.exports = function (table) {
    var result = function (value) {
        if (arguments.length === 0) {
            return table.insert();
        }
        var key = value[table.key];
        if (value.hasOwnProperty(table.key) && table.hasRow(key)) {
            return key;
        }
        return table.insert(value)
    };
    result.dependsOn = table;
    return result;
};