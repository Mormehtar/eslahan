var chooseFromRange = require("../utils/chooseFromRange");
var generateString = require("../utils/generateString");
var baseGenerator = require("../utils/baseGenerator");

var generator = generateString.generator;

var defaults = {
    wordFrom: 2,
    wordTo: 8,
    symbols: generateString.symbols.LATIN,
    wordsFrom: 1,
    wordsTo: 1,
    delimiter: generateString.symbols.SPACE,
    transformer: null
};

var converterGenerator = function (options) {
    return function (value) {
        if (options.transformer) {
            return {
                model: value,
                insert: options.transformer(value)
            };
        } else {
            return value;
        }
    }
};

var specificGenerator = function (options) {
    var converter = converterGenerator(options);
    return  function () {
        var nWords = chooseFromRange(options.wordsFrom, options.wordsTo);
        var result = "";
        while (nWords--) {
            result += generator(chooseFromRange(options.wordFrom, options.wordTo), options.symbols);
            if (nWords) {
                result += generator(1, options.delimiter);
            }
        }
        return converter(result);
    }
};

module.exports = function (options) {
    return baseGenerator({
        options: options,
        defaults: defaults,
        specificGenerator: specificGenerator,
        converterGenerator: converterGenerator
    });
};
module.exports.symbols = generateString.symbols;