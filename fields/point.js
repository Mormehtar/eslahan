var baseGenerator = require("../utils/baseGenerator");
var float = require("./float");

var defaults = {
    x: {from: -1, to: 1},
    y: {from: -1, to: 1}
};

function converter (value) {
    if (typeof value == "object") {
        return {
            model: value,
            insert: '(' + value.x + ',' + value.y + ')'
        };
    } else if (value) {
        return value;
    }
}

function specificGenerator (options) {

    var xGenerator = float(options.x);
    var yGenerator = float(options.y);

    return function () {
        return converter({
            x: xGenerator(),
            y: yGenerator()
        });
    };
}

module.exports = function (options) {
    return baseGenerator({
        options: options,
        defaults: defaults,
        converterGenerator: converter,
        specificGenerator: specificGenerator
    });
};