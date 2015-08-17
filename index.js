var Table = require("./table");
var DBEnvError = require("./errors");

function DBEnv (dao) {
    this.dao = dao;
    this.tables = {};
    this.finalized = false;
}

module.exports = DBEnv;

DBEnv.prototype.addTable = function (name) {
    if (this.finalized) {
        throw new DBEnvError("Can`t add table to finalized table");
    }
    if (this.tables[name]) {
        throw new DBEnvError("Can`t add table " + name + " again");
    }
    var table = new Table(name, this.dao[name]);
    this.tables[name] = {
        table: table,
        priority: -1,
        dependencies: -1,
        depends: []
    };
    this.tableOrder = [];
    return table;
};

DBEnv.prototype.getTable = function (tableName) {
    var table = this.tables[tableName];
    if (!table) { throw new DBEnvError("Cant`find table " + tableName); }
    return table.table;
};

function checkTables (table, unfinished, finished) {
    var newFinished = [];
    for (var i = unfinished.length; --i;) {
        var checkingTable = unfinished[i];
        if (checkingTable.depends[table.table.name]) {
            checkingTable.priority = Math.max(checkingTable.priority, table.priority + 1);
            delete checkingTable.depends[table.table.name];
            --checkingTable.dependencies;
            if (checkingTable.dependencies == 0) {
                newFinished.push(checkingTable);
                unfinished.splice(i, 1);
            }
        }
    }
    newFinished.forEach(function (newFinishedTable) {
        checkTables(newFinishedTable, unfinished, finished);
    });
    finished = finished.concat(newFinished);
}

DBEnv.prototype.finalize = function () {
    if (this.finalized) {
        throw new DBEnvError("Can`t finalize finalized environment!");
    }
    var self = this;
    var finished = [];
    var unfinished = [];
    var tables = Object.keys(self.tables).map(function (tableName) {
        var table = self.tables[tableName];
        table.table.finalize();
        var fields = table.table.fields;
        table.dependencies = 0;
        table.depends = Object.keys(fields).map(function (fieldName) {
            var dependency = fields[fieldName].dependency;
            return dependency && dependency.name;
        }).filter(function (table) {
            if (table) {
                ++table.dependencies;
                return true;
            }
        }).reduce(function (obj, table) {
            obj[table] = true;
            return obj;
        }, {});
        if (table.dependencies === 0) {
            table.priority = 0;
            finished.push(table);
        } else {
            unfinished.push(table);
        }
        return self.tables[tableName];
    });

    for (var i=unfinished.length; --i;) {
        checkTables(finished[i], unfinished, finished);
    }

    if (unfinished.length) {
        throw DBEnvError("There are table with open dependencies: " + unfinished.map(function (table) {
                return table.table.name;
            }).join(", "));
    }

    tables.sort(function (t1, t2) {
        return t2.priority - t2.priority;
    });

    this.tableOrder = tables.map(function (table) {
        return table.table.name;
    });

    return this.finalized = true;
};
