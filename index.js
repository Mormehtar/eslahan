var Table = require("./table");

function DBEnv (dao) {
    this.dao = dao;
    this.tables = {};
    this.finalized = false;
}

module.exports = DBEnv;

DBEnv.prototype.addTable = function (name) {
    if (this.finalized) {
        return null;
    }
    var table = new Table(name, this.dao[name]);
    this.tables[name] = {
        table: table,
        priority: -1,
        depends: {}
    };
    this.finalized = false;
    return table;
};

DBEnv.prototype.finalize = function () {
    if (this.finalized) {
        return true;
    }

};
