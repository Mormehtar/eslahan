var chooseLength = require("./utils/chooseLength");
var generateString = require("./utils/generateString");
var baseGenerator = require("./utils/baseGenerator");

var defaults = {
    addressFrom: 3,
    addressTo: 8,
    serverFrom: 3,
    serverTo: 8,
    domainFrom: 1,
    domainTo: 3
};

var generator = generateString.generator;
var SYMBOLS = generateString.symbols.LATIN;

var specificGenerator = function (options) {
    return function () {
        return generator(chooseLength(options.addressFrom, options.addressTo), SYMBOLS)
            + "@"
            + generator(chooseLength(options.serverFrom, options.serverTo), SYMBOLS)
            + "."
            + generator(chooseLength(options.domainFrom, options.domainTo), SYMBOLS);
    }
};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};