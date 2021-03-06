var fs = require("fs");
var path = require("path");

module.exports = function (basePath) {
    return fs.readdirSync(basePath).reduce(function (obj, fileName) {
        var extPos = fileName.indexOf(".js");
        if (extPos != -1) {
            var base = fileName.substr(0, extPos);
            obj[base] = require(path.join(basePath, fileName));
        }
        return obj;
    }, {});
};