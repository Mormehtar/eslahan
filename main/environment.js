var Promise = require("bluebird");
var Table = require("./table");
var DBEnvError = require("./error");

function dictChooser (tableName, dao) {
    return dao[tableName];
}

function checkTables (table, unfinished, finished) {
    var newFinished = [];
    for (var i = unfinished.length; i;) {
        var checkingTable = unfinished[--i];
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

function DBEnv (dao, tableGetter) {
    this.tableGetter = tableGetter || dictChooser;
    this.dao = dao;
    this.tables = {};
    this.tableOrder = [];
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
    var table = new Table(name, this.tableGetter(name, this.dao));
    this.tables[name] = {
        table: table,
        priority: -1,
        dependencies: -1,
        depends: {}
    };
    return table;
};

DBEnv.prototype.getTable = function (tableName) {
    var table = this.tables[tableName];
    if (!table) { throw new DBEnvError("Cant`find table " + tableName); }
    return table.table;
};

DBEnv.prototype.finalize = function () {
    if (this.finalized) {
        throw new DBEnvError("Can`t finalize finalized environment!");
    }
    var self = this;
    var finished = [];
    var unfinished = [];
    var tables = Object.keys(self.tables).map(function (tableName) {
        var table = self.tables[tableName];
        if (!table.table.finalized) {
            table.table.finalize();
        }
        var fields = table.table.fields;

        table.depends = Object.keys(fields).reduce(function (obj, fieldName) {
            var dependency = fields[fieldName].dependency;
            if ( dependency && dependency != table.table && dependency.name) { obj[dependency.name] = true }
            return obj;
        }, {});
        table.dependencies = Object.keys(table.depends).length;

        if (table.dependencies === 0) {
            table.priority = 0;
            finished.push(table);
        } else {
            unfinished.push(table);
        }
        return self.tables[tableName];
    });

    for (var i=finished.length; i;) {
        checkTables(finished[--i], unfinished, finished);
    }

    if (unfinished.length) {
        throw new DBEnvError("There are table with open dependencies: " + unfinished.map(function (table) {
                return table.table.name;
            }).join(", "));
    }

    tables.sort(function (t1, t2) {
        return t1.priority - t2.priority;
    });

    this.tableOrder = tables.map(function (table) {
        return table.table.name;
    });

    this.finalized = true;
};

DBEnv.prototype.cleanup = function () {
    if (!this.finalized) {
        throw new DBEnvError("Can`t clean up not finalized environment");
    }
    for (var i = this.tableOrder.length; i;) {
        this.tables[this.tableOrder[--i]].table.cleanup();
    }
};

DBEnv.prototype.saveFixture = function() {
    return Promise.resolve().bind(this).then(function () {
        if (!this.finalized) {
            throw new DBEnvError("Can`t save fixture from not finalized environment");
        }
        return this.tableOrder
    }).mapSeries(function (tableName){
        return this.tables[tableName].table.saveFixture();
    });
};

DBEnv.prototype.setFixture = function () {
    if (!this.finalized) {
        throw new DBEnvError("Can`t set fixture to not finalized environment");
    }
    this.cleanup();
    for (var i = 0, max = this.tableOrder.length; i < max;) {
        this.tables[this.tableOrder[i++]].table.setFixture();
    }
};