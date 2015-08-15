var assert = require("chai").assert;
var REPEATS = 100;

exports.check = function (func, reg) {
    for (var i = 0; i<REPEATS; ++i) {
        var result = func();
        assert.match(result, reg);
    }
};
