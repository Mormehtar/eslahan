var uuid = require("uuid").v4;

module.exports = function () {
    return function (value) {
        return value || uuid();
    }
};