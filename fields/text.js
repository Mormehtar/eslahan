var chooseFromRange = require("../utils/chooseFromRange");
var generateString = require("../utils/generateString");
var baseGenerator = require("../utils/baseGenerator");

var defaults = {
    from: 2,
    to: 8
};


var generator = generateString.generator;
var SYMBOLS = generateString.symbols.LATIN;

var specificGenerator = function (options) {
    return  function () {
        return generator(chooseFromRange(options.from, options.to), SYMBOLS);
    }
};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};