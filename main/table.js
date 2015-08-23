var DBEnvError = require("./error");

function Table (name, dao) {
    if (arguments.length != 2) {
        throw new DBEnvError("Expect exactly 2 parameters");
    }
    if (!dao || typeof dao.insert != "function" || typeof dao.delete != "function") {
        throw new DBEnvError("Expect valid DAO with insert and delete methods");
    }
    this.name = name;
    this.fields = {};
    this.dao = dao;
    this.key = null;
    this.rows = {};
    this.finalized = false;
    this.indexes = {};
    this.pluginsNames = [];
    this.plugins = {};
}

module.exports = Table;

function addIndexElement (index, key, element) {
    if (!index[element]) {
        index[element] = [];
    }
    index[element].push(key);
}

Table.prototype.addField = function (name, generator, key) {
    if (this.finalized) {
        throw new DBEnvError("Can`t add field to finalized table");
    }
    this.fields[name] = generator;
    if (key) {
        this.setKey(name);
    }
    return this;
};

Table.prototype.insert = function (data) {
    if (!this.finalized) {
        throw new DBEnvError("Can`t insert row into not finalized table");
    }
    data = data || {};
    var self = this;
    var fields = Object.keys(this.fields);
    var insertObject = fields.reduce(function (obj, fieldName) {
        obj[fieldName] = data.hasOwnProperty(fieldName) ? self.fields[fieldName](data[fieldName]) : self.fields[fieldName]();
        return obj;
    }, {});
    self.dao.insert(insertObject);
    var key = insertObject[self.key];
    fields.forEach(function (fieldName) {
        if (self.indexes[fieldName]) {
            addIndexElement(self.indexes[fieldName], key, insertObject[fieldName]);
        }
    });
    self.rows[key] = insertObject;
    self.pluginsNames.forEach(function (pluginName) {
        self.plugins[pluginName].call(self, key, data[pluginName]);
    });
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
    if (!this.fields[fieldName]) {
        throw new DBEnvError("Can`t set non existent field as key field");
    }
    this.key = fieldName;
};

Table.prototype.getRow = function (key, options) {
    if (!this.finalized) {
        throw new DBEnvError("Can`t get row from not finalized table");
    }
    var _options = options || {};
    var fields = _options.fields ? _options.fields : Object.keys(this.fields);
    var self = this;
    var row = self.rows[key];
    if (!row) {
        return undefined;
    }
    return fields.reduce(function (obj, field) {
        var fieldName = typeof field == "string" ? field : field.name;
        var dependency = self.fields[fieldName].dependency;
        if (dependency && row[fieldName] != null && _options.populated) {
            if (self.fields[fieldName].hasOwnProperty("field") && self.fields[fieldName].field != dependency.key) {
                obj[fieldName] = dependency.getRowsByIndex(self.fields[fieldName].field, row[fieldName], field);
            } else {
                obj[fieldName] = dependency.getRow(row[fieldName], field);
            }
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
        throw new DBEnvError("Can`t finalize table without fields");
    }
    var key = this.key;
    if (!key || !this.fields[key]) {
        throw new DBEnvError("Can`t finalize table without key field");
    }
    this.finalized = true;
};

Table.prototype.addIndex = function (fieldName) {
    if (Object.keys(this.fields).indexOf(fieldName) === -1) {
        throw new DBEnvError("Can`t add index for field " + fieldName + " it is absent");
    }
    if (this.indexes[fieldName]) {
        return this;
    }
    this.indexes[fieldName] = {};
    if (this.finalized) {
        var self = this;
        var index = self.indexes[fieldName];
        Object.keys(self.rows).forEach(function (key) {
            var element = self.rows[key][fieldName];
            addIndexElement(index, key, element);
        });
    }
    return this;
};

Table.prototype.dropIndex = function (fieldName) {
    if (Object.keys(this.fields).indexOf(fieldName) === -1) {
        throw new DBEnvError("Can`t add index for field " + fieldName + " it is absent");
    }
    delete this.indexes[fieldName];
    return this;
};

Table.prototype.getRowsByIndex = function (fieldName, fieldValue, options) {
    if (!this.indexes[fieldName]) {
        throw new DBEnvError("There is no index for field: "+ fieldName);
    }
    if (!this.indexes[fieldName][fieldValue]) {
        return [];
    }
    var self = this;
    return this.indexes[fieldName][fieldValue].map(function (key) {
        return self.getRow(key, options);
    });
};

Table.prototype.addPlugin = function (name, plugin) {
    if (this.plugins[name]) {
        throw new DBEnvError("Plugin " + name + "already existent");
    }
    this.plugins[name] = plugin;
    this.pluginsNames.push(name);
    return this;
};

Table.prototype.deletePlugin = function (name) {
    if (this.plugins[name]) {
        delete this.plugins[name];
        this.pluginsNames.splice(this.pluginsNames.indexOf(name), 1);
        return this;
    }
    throw new DBEnvError("Plugin " + name + "is absent");
};