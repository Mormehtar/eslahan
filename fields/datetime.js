var baseGenerator = require("../utils/baseGenerator");
var moment = require("moment");
var chooseFromRange = require("../utils/chooseFromRange");

var defaults = {
    from: null,
    to: null,
    transformer: function (value) {
        return value instanceof Date ? value.toISOString() : value;
    }
};

var converterGenerator = function (options) {
    return function (value) {
        if (options.transformer) {
            var transformed = options.transformer(value);
            if (transformed === value) {
                return value;
            }
            return {
                model: value,
                insert: transformed
            };
        } else {
            return value;
        }
    }
};

var specificGenerator = function (options) {
    var converter = converterGenerator(options);
    options.from = options.from == null? null : Number(moment(options.from).format('x'));
    options.to = options.to == null? null : Number(moment(options.to).format('x'));
    return  function () {
        var begin = options.from == null ? Date.now() : options.from;
        var end = options.to == null ? Date.now() : options.to;
        return converter(new Date(chooseFromRange(begin, end)));
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