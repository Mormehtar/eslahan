var baseGenerator = require("../utils/baseGenerator");

var specificGenerator = function (options) {
    return function () {
        return (Math.random() * (options.to - options.from) + options.from).toFixed(options.fractionalDigits);
    };
};

var defaults = { from: 0, to: 100, fractionalDigits: 2};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};