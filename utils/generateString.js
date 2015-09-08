exports.generator = function (l, symbols) {
    var symbolLength = symbols.length;
    var result = "";
    var length = 0;
    while (length < l) {
        result += symbols[Math.floor(Math.random() * symbolLength)];
        ++length;
    }
    return result;
};

exports.symbols = {
    LATIN: "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM",
    SPACE: " ",
    DELIMITERS: " ,./\\!?:;",
    CYRILLIC: "йцукенгшщзхъфывапролджэячсмитьбюёЁЙЦУКЕНГШЩЗХЪЭЖДЛОРПАВЫФЯЧСМИТЬБЮ",
    DIGITS: "0123456789"
};
