var baseGenerator = require("../utils/baseGenerator");

var specificGenerator = function (options) {
    return function () {
        return (Math.random() > options.probability);
    };
};

var defaults = { probability: 0.5 };

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};
