var requireDirectory = require("./utils/requireDirectory");
var path = require("path");

module.exports = requireDirectory(path.join(__dirname, "plugins"));