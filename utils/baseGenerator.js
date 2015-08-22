module.exports = function (params) {
    var options = params.options || {};
    var defaults = params.defaults || {};
    options = Object.keys(defaults).reduce(function (obj, key) {
        if (!options.hasOwnProperty(key)) {
            obj[key] = defaults[key];
        }
        return obj;
    }, options);

    var nullable = options.nullable || 0;

    var specificFunction = params.specificGenerator(options);
    var converter = params.converterGenerator ? params.converterGenerator(options) : function (value) { return value };

    return function (value) {
        if (arguments.length > 0) {
            return converter(value);
        }
        if (nullable) {
            if (Math.random() <= nullable) {
                return null;
            }
        }
        return specificFunction();
    }
};