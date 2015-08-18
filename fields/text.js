var LATIN_SYMBOLS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
var LATIN_LENGTH = LATIN_SYMBOLS.length;

var baseGenerator = require("./utils/baseGenerator");

var defaults = {
    length: 5,
    dispertion: 3
};

var specificGenerator = function (options) {
    var minimal = Math.max(options.length - options.dispertion, 1);
    var maximal = Math.max(options.length + options.dispertion, 0);
    var probability = 0.5 / Math.max(options.dispertion, 1);
    return  function () {
        var result = "";
        var length = 0;
        while (length < minimal || !(Math.random() < probability || length >= maximal)) {
            result += LATIN_SYMBOLS[Math.floor(Math.random() * LATIN_LENGTH)];
            ++length;
        }
        return result;
    }
};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};