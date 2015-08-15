var LATIN_SYMBOLS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
var LATIN_LENGTH = LATIN_SYMBOLS.length;
module.exports = function (orptions) {
    var _options = orptions || {};
    var length = _options.hasOwnProperty("length") ? (_options.length || 0) : 5;
    var dispertion = _options.hasOwnProperty("dispertion") ? (_options.dispertion || 0) : 3;
    var minimal = Math.max(length - dispertion, 1);
    var maximal = Math.max(length + dispertion, 0);
    var probability = 0.5 / Math.max(dispertion, 1);
    return  function (value) {
        if (arguments.length > 0) {
            return value;
        }
        var result = "";
        var length = 0;
        while (length < minimal || !(Math.random() < probability || length >= maximal)) {
            result += LATIN_SYMBOLS[Math.floor(Math.random() * LATIN_LENGTH)];
            ++length;
        }
        return result;
    }
};