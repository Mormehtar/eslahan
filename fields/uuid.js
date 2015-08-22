var uuid = require("uuid").v4;
var baseGenerator = require("../utils/baseGenerator");

var specificGenerator = function () { return function () { return uuid(); }; };

module.exports = function (options) {
    return baseGenerator({options: options, specificGenerator: specificGenerator});
};