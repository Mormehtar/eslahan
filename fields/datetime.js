var baseGenerator = require("./utils/baseGenerator");
var moment = require("moment");
var chooseFromRange = require("./utils/chooseFromRange");

var defaults = {
    from: null,
    to: null,
};

var specificGenerator = function (options) {
    options.from = options.from == null? null : Number(moment(options.from).format('x'));
    options.to = options.to == null? null : Number(moment(options.to).format('x'));
    return  function () {
        var begin = options.from == null ? Date.now() : options.from;
        var end = options.to == null ? Date.now() : options.to;
        return new Date(chooseFromRange(begin, end));
    }
};

module.exports = function (options) {
    return baseGenerator({options: options, defaults: defaults, specificGenerator: specificGenerator});
};