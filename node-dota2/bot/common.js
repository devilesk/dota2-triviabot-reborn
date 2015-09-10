function tokenize(msg) {
    var re = /[^\s"]+|"([^"]*)"/gi,
        args = [];

    do {
        //Each call to exec returns the next regex match as an array
        var match = re.exec(msg);
        if (match != null) {
            //Index 1 in the array is the captured group if it exists
            //Index 0 is the matched text, which we use if no captured group exists
            args.push(match[1] ? match[1] : match[0]);
        }
    } while (match != null);
    return args;
}

exports.tokenize = tokenize;