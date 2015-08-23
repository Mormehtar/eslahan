var baseGenerator = require("../utils/baseGenerator");

var specificGenerator = function (options) { return function () { return options.from++; }; };

var defaults = { from: 1};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};