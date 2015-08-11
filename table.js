var DBEnvError = require("./errors");

function Table (name, dao) {
    this.name = name;
    this.fields = {};
    this.dao = dao;
    this.key = null;
    this.rows = {};
    this.finalized = false;
}

module.exports = Table;

Table.prototype.addField = function (name, generator, key) {
    if (this.finalized) {
        throw new DBEnvError("Can`t add field to finalized table");
    }
    var self = this;
    self.fields[name] = {
        generator: generator,
        dependency: generator.dependsOn
    };
    if (key) {
        this.setKey(name);
    }
};

Table.prototype.insert = function (data) {
    if (!this.finalized) {
        throw new DBEnvError("Can`t insert row into not finalized table");
    }
    var self = this;
    var insertObject = Object.keys(this.fields).reduce(function (obj, fieldName) {
        obj[fieldName] = data.hasOwnProperty(fieldName) ? self.fields[fieldName].constructor(data[fieldName]) : self.fields[fieldName].constructor();
        return obj;
    }, {});
    self.dao.insert(insertObject);
    var key = insertObject[self.key];
    self.rows[key] = insertObject;
    return key;
};

Table.prototype.cleanup = function () {
    if (!this.finalized) {
        throw new DBEnvError("Can`t cleanup not finalized table");
    }
    this.dao.delete();
    this.rows = {};
};

Table.prototype.setKey = function (fieldName) {
    if (this.finalized) {
        throw new DBEnvError("Can`t set key to finalized table");
    }
    this.key = fieldName;
};

Table.prototype.getRow = function (key, fields, populated) {
    if (!this.finalized) {
        throw new DBEnvError("Can`t get row from not finalized table");
    }
    var _fields = fields? fields : Object.keys(this.fields);
    var self = this;
    var row = self.rows[key];
    return _fields.reduce(function (obj, field) {
        var fieldName = typeof field == "string" ? field : field.name;
        var dependency = self.fields[fieldName].dependency;
        if (dependency && populated) {
            obj[fieldName] = dependency.getRow(row[fieldName], field.fields, field.hadOwnProperty(populated) ? field.populated : true);
        } else {
            obj[fieldName] = row[fieldName];
        }
        return obj;
    }, {});
};

Table.prototype.hasRow = function (key) {
    return this.rows.hasOwnProperty(key);
};

Table.prototype.finalize = function () {
    if (this.finalized) {
        throw new DBEnvError("Can`t finalize finalized table");
    }
    if (Object.keys(this.fields).length === 0) {
        throw new DBEnvError("Can`t finalize table without rows");
    }
    if (!this.key || !this.fields[key]) {
        throw new DBEnvError("Can`t finalize table without key field");
    }
    return this.finalized = true;
};