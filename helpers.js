const c = require('irc-colors')

function numberWithCommas(x, add_commas) {
    if (add_commas) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        return x;
    }
}

function colorize(x, text) {
    if (x > 0) {
        return c.lime(text);
    } else if (x < 0) {
        return c.red(text);
    } else {
        return text;
    }
}

function abbreviateNumber(num) {
    fixed = 1;
    if (num === null) {
        return null;
    } // terminate early
    if (num === 0) {
        return '0';
    } // terminate early
    fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
    var b = (num).toPrecision(2).split("e"), // get power
        k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
        c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
        d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
        e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
}

module.exports.numberWithCommas = numberWithCommas;
module.exports.colorize = colorize;
module.exports.abbreviateNumber = abbreviateNumber;
