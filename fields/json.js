var baseGenerator = require("../utils/baseGenerator");

function generateObjectLine (object, template) {
    var elements = Object.keys(template);
    return elements.reduce(function (obj, fieldName) {
        var field = template[fieldName];
        if ((typeof field !== "object") || (field instanceof Date)) {
            obj[fieldName] = field;
        } else {
            if (!field.hasOwnProperty("probability") || Math.random() > field.probability) {
                if (field.hasOwnProperty("value") && !field.hasOwnProperty("generator")) {
                    obj[fieldName] = field.value;
                } else {
                    if (typeof field.generator == "function") {
                        obj[fieldName] = field.hasOwnProperty("value") ? field.generator(field.value) : field.generator();
                    } else {
                        obj[fieldName] = generateObjectLine({}, field.generator);
                    }
                }
            }
        }
        return obj;
    }, object);
}

var specificGenerator = function (options) {
    return function () {
        return JSON.stringify(generateObjectLine({}, options.template));
    };
};

var defaults = { template: {} };

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};