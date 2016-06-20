var chooseFromRange = require("../utils/chooseFromRange");
var generateString = require("../utils/generateString");
var baseGenerator = require("../utils/baseGenerator");

var defaults = {
    domainsOptions: [
        {
            from: 2,
            to: 3
        },
        {
            from: 3,
            to: 8
        }
    ],
    pathFrom: 3,
    pathTo: 8
};

var generator = generateString.generator;
var SYMBOLS = generateString.symbols.LATIN;

var specificGenerator = function (options) {
    return function () {
        var result = options.domainsOptions.map(function (domainOptions) {
            return "value" in domainOptions ? domainOptions.value : generator(chooseFromRange(domainOptions.from, domainOptions.to), SYMBOLS);
        }).join(".");
        var path = "path" in options ? options.path : generator(chooseFromRange(options.pathFrom, options.pathTo), SYMBOLS);
        return path ? [ result, path ].join("/") : result;
    };
};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};