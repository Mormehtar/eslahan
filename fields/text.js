var LATIN_SYMBOLS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
var LATIN_LENGTH = LATIN_SYMBOLS.length;
module.exports = function (length, dispertion) {
    var _length = arguments.length > 0 ? (length || 0) : 5;
    var _dispertion = arguments.length > 1 ? (dispertion || 0) : 3;
    var _from = Math.max(_length - _dispertion, 0);
    var _to = Math.max(_length + _dispertion, 0);
    var probability = 0.5 / Math.max(_dispertion, 1);
    return  function (value) {
        if (arguments.length > 0) {
            return value;
        }
        var result = "";
        var length = 0;
        while (length < _from || !(Math.random() < probability || length >= _to)) {
            result += LATIN_SYMBOLS[Math.floor(Math.random() * LATIN_LENGTH)];
            ++length;
        }
        return result;
    }
};