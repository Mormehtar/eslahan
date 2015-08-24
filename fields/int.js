var baseGenerator = require("../utils/baseGenerator");
var chooseFromRange = require("../utils/chooseFromRange");

var specificGenerator = function (options) { return function () { return chooseFromRange(options.from, options.to); }; };

var defaults = { from: 0, to: 100};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};