var LATIN_SYMBOLS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
var LATIN_LENGTH = LATIN_SYMBOLS.length;

var baseGenerator = require("./utils/baseGenerator");

var defaults = {
    addressFrom: 3,
    addressTo: 8,
    serverFrom: 3,
    serverTo: 8,
    domainFrom: 1,
    domainTo: 3
};

function chooseLength (begin, end) {
    return Math.floor(Math.random() * (end - begin + 1) + begin);
}

function generateString (l) {
    var result = "";
    var length = 0;
    while (length < l) {
        result += LATIN_SYMBOLS[Math.floor(Math.random() * LATIN_LENGTH)];
        ++length;
    }
    return result;
}

var specificGenerator = function (options) {
    return function () {
        var addressLength = chooseLength(options.addressFrom, options.addressTo);
        var serverLength = chooseLength(options.serverFrom, options.serverTo);
        var domainLength = chooseLength(options.domainFrom, options.domainTo);
        return generateString(addressLength) + "@" + generateString(serverLength) + "." + generateString(domainLength);
    }
};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};