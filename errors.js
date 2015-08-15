var util = require("util");
function DBEnvError (message) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}
util.inherits(DBEnvError, Error);

module.exports = DBEnvError;