module.exports = function (begin, end) {
    return Math.floor(Math.random() * (end - begin + 1) + begin);
};