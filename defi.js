const config = require('./config.prod.json');
//const config = require('./config.test.json');

var irc = require("irc");
const c = require('irc-colors');
const https = require('https');
const CoinGecko = require('coingecko-api');

var db = require('./db.js');

const h = require('./helpers.js');

const CoinGeckoClient = new CoinGecko();

var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

bot.addListener("message", function(from, to, text, message) {
    if (text == ".cg trending") {
        showTrending();
    } else if (text == ".cg defi") {
        showDefi();
    } else if (text == ".cg help") {
        showHelp();
    }
    else if (text == ".gas") {
        showGas();
    } else if (text.match(/\.cg +search +(\w+)/)) {
        let command = text.match(/^\.cg search +(\w+)/);
        if (command[1]) {
            let symbol = command[1];

            search = ['%' + symbol + '%', '%' + symbol + '%'];

            let sql = "SELECT id, symbol from coins Where id Like ? Or symbol like ? LIMIT 0,10";

            db.all(sql, search, (err, rows) => {
                if (err) {
                    return console.error(err.message);
                }
                msg = "";
                rows.forEach(row => {
                    msg += row.id + " (" + row.symbol + ")  ";
                });
                if (msg == "") {
                    bot.say(config.channels[0], 'No coin found.');
                } else {
                    bot.say(config.channels[0], msg);
                }
            });
        }
    } else if (text.match(/\.cg +dev +(\w+)/)) {
        let command = text.match(/^\.cg +dev +(\w+)/);
        if (command[1]) {
            let sql = "select id, icon from coins where symbol = ? ORDER BY priority DESC";
            let symbol = command[1];
            db.get(sql, symbol, (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                return row ?
                    showCoinDev(row.id, row.price) :
                    bot.say(config.channels[0], `No coin found with the symbol ${symbol}`);

            });
        }
    } else if (text.match(/\.cg +icon +(\w+) +(.*)/)) {
        let command = text.match(/^\.cg +icon +(\w+) +(.*)/);
        if (command[1]) {
            let sql = "select id from coins where symbol = ? ORDER BY priority DESC";
            let symbol = command[1];
            console.log(command[2]);
            let icon = command[2].substring(0, 2);
            console.log("icon " + icon + " for " + symbol);

            db.get(sql, symbol, (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                return row ?
                    setIcon(row.id, icon) :
                    bot.say(config.channels[0], `No coin found with the symbol ${symbol}`);

            });
        }
    } else if (text.match(/\.cg +links +(\w+)/)) {
        let command = text.match(/^\.cg +links +(\w+)/);
        if (command[1]) {
            let sql = "select id, icon from coins where symbol = ? ORDER BY priority DESC";
            let symbol = command[1];
            db.get(sql, symbol, (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                return row ?
                    showCoinLinks(row.id, row.icon) :
                    bot.say(config.channels[0], `No coin found with the symbol ${symbol}`);

            });
        }
    } else if (text.match(/\.cg +price +(\w+)/)) {
        let command = text.match(/^\.cg +price +(\w+)/);
        if (command[1]) {
            let sql = "select id, icon from coins where symbol = ? ORDER BY priority DESC";
            let symbol = command[1];
            db.get(sql, symbol, (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                return row ?
                    showCoinPrice(row.id, row.icon) :
                    bot.say(config.channels[0], `No coin found with the symbol ${symbol}`);

            });
        }
    } else if (text.match(/\.cg +id +(\w+)/)) {
        let command = text.match(/^\.cg +id +(\w+)/);
        let id = command[1];
        console.log("id " + id);
        showCoin(id, "");

    } else if (text.match(/^\.cg +[0-9]+\/[0-9]+\/[0-9]+ /)) {
        let command = text.match(/^\.cg +([0-9]+)\/([0-9]+)\/([0-9]+)  *(\w*)/);
        month = command[1];
        day = command[2];
        year = command[3];
        symbol = command[4];
        the_date = day + "-" + month + "-" + year;
        the_date2 = month + "/" + day + "/" + year;

        let sql = "select id from coins where symbol = ? ORDER BY priority DESC";

        db.get(sql, symbol, (err, row) => {
            if (err) {
                return console.error(err.message);
            }
            return row ?
                showCoinHistory(row.id, the_date, the_date2) :
                bot.say(config.channels[0], `No coin found with the symbol ${symbol}`);

        });
    } else if (text.match(/^\.cg +\w+/)) {
        let commands_match = text.match(/^\.cg  *([a-zA-Z0-9 ]*)/);
        let commands = commands_match[1].split(" ");
        let count = 0;
        commands.forEach(function (command) {
            count += 1;
            if (count < 6) {
            let sql = "select id, icon from coins where symbol = ? ORDER BY priority DESC";
            let symbol = command;
            db.get(sql, symbol, (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                return row ?
                     showCoin(row.id, row.icon) :
                    console.log(`No coin found with the symbol ${symbol}`);

            });
            }
        });
    }
});

var showCoin = async (id, icon) => {
    let data = await CoinGeckoClient.coins.fetch(id, {
        'localization': false,
        'developer_data': false,
        'tickers': false,
        'sparkline': false
    });
    //      console.log(data.data);

    coin = data.data;
    price = coin.market_data.current_price.usd;
    if (price < .01) {
        dec = 6;
        commas = false;
    } else if (price < 1) {
        dec = 4;
        commas = false;
    } else if (price < 10) {
        dec = 3;
        commas = false;
    } else {
        dec = 2;
        commas = true;
    }
    name = coin.name;
    price = h.numberWithCommas(price.toFixed(dec), commas);
    ath = h.numberWithCommas(coin.market_data.ath.usd.toFixed(dec), commas);
    cap = coin.market_data.market_cap.usd;
    cap_rank = coin.market_cap_rank;
    vol = coin.market_data.total_volume.usd;
    high_24h = h.numberWithCommas(coin.market_data.high_24h.usd.toFixed(dec), commas);
    low_24h = h.numberWithCommas(coin.market_data.low_24h.usd.toFixed(dec), commas);
    price_change_24h = coin.market_data.price_change_percentage_24h.toFixed(2);
    price_change_7d = coin.market_data.price_change_percentage_7d.toFixed(2);
    price_change_30d = coin.market_data.price_change_percentage_30d.toFixed(2);
    price_change_24h_currency = coin.market_data.price_change_24h_in_currency.usd.toFixed(dec);
    if (price_change_24h > 0) {
        change = c.lime(" +" + price_change_24h_currency + " +" + price_change_24h + "%");
    } else if (price_change_24h < 0) {
        change = c.red(" " + price_change_24h_currency + " " + price_change_24h + "%");
    } else {
        change = " +" + price_change_24h_currency + " +" + price_change_24h + "%";
    }

    price_change_7d = h.colorize(price_change_7d, price_change_7d + "%");
    price_change_30d = h.colorize(price_change_30d, price_change_30d + "%");

    if (cap > 0) {
        cap_text = "cap: " + h.abbreviateNumber(cap) + "(#" + cap_rank + ")";
    } else {
        cap_text = "cap: ?";
    }

    if (vol > 0) {
        vol = h.abbreviateNumber(vol);
    }

    if (icon != "") {
        name = name + " " + icon;
    }

    bot.say(config.channels[0], c.bold(name) + ": $" + price + change + " 24h range (" + low_24h + "-" + high_24h + ") | 7d: " + price_change_7d + " 30d: " + price_change_30d + " |  vol: " + vol + " | ath: " + ath + " | " + cap_text);
};

var showCoinPrice = async (id, icon) => {
    let data = await CoinGeckoClient.coins.fetch(id, {
        'localization': false,
        'developer_data': false,
        'tickers': false,
        'sparkline': false
    });
    //      console.log(data.data);

    coin = data.data;
    price = coin.market_data.current_price.usd;
    if (price < .01) {
        dec = 6;
        commas = false;
    } else if (price < 1) {
        dec = 4;
        commas = false;
    } else if (price < 10) {
        dec = 3;
        commas = false;
    } else {
        dec = 2;
        commas = true;
    }
    name = coin.name;
    price = h.numberWithCommas(price.toFixed(dec), commas);
    ath = h.numberWithCommas(coin.market_data.ath.usd.toFixed(dec), commas);
    atl = h.numberWithCommas(coin.market_data.atl.usd.toFixed(dec), commas);
    high_24h = h.numberWithCommas(coin.market_data.high_24h.usd.toFixed(dec), commas);
    low_24h = h.numberWithCommas(coin.market_data.low_24h.usd.toFixed(dec), commas);
    price_change_1h = coin.market_data.price_change_percentage_1h_in_currency.usd.toFixed(dec);
    price_change_24h = coin.market_data.price_change_percentage_24h.toFixed(2);
    price_change_7d = coin.market_data.price_change_percentage_7d.toFixed(2);
    price_change_14d = coin.market_data.price_change_percentage_14d.toFixed(2);
    price_change_30d = coin.market_data.price_change_percentage_30d.toFixed(2);
    price_change_60d = coin.market_data.price_change_percentage_60d.toFixed(2);
    price_change_200d = coin.market_data.price_change_percentage_200d.toFixed(2);
    price_change_1y = coin.market_data.price_change_percentage_1y.toFixed(2);
    price_change_24h_currency = coin.market_data.price_change_24h_in_currency.usd.toFixed(dec);
    if (price_change_24h > 0) {
        change = c.lime(" +" + price_change_24h_currency + " +" + price_change_24h + "%");
    } else if (price_change_24h < 0) {
        change = c.red(" " + price_change_24h_currency + " " + price_change_24h + "%");
    } else {
        change = " +" + price_change_24h_currency + " +" + price_change_24h + "%";
    }


    price_change_1h = h.colorize(price_change_1h, price_change_1h + "%");
    price_change_7d = h.colorize(price_change_7d, price_change_7d + "%");
    price_change_14d = h.colorize(price_change_14d, price_change_14d + "%");
    price_change_30d = h.colorize(price_change_30d, price_change_30d + "%");
    price_change_60d = h.colorize(price_change_60d, price_change_60d + "%");
    price_change_200d = h.colorize(price_change_200d, price_change_200d + "%");
    price_change_1y = h.colorize(price_change_1y, price_change_1y + "%");
    if (icon != "") {
        name = name + " " + icon;
    }

    bot.say(config.channels[0], c.bold(name) + ": $" + price + " | 1h: " + price_change_1h + "  24h: " + change + "  7d: " + price_change_7d + " 14d: " + price_change_14d +
        " 30d: " + price_change_30d + "  60d: " + price_change_60d + " 200d: " + price_change_200d + " 1y: " + price_change_1y + " |  atl-ath: $" + atl + "-" + ath);
};




var showCoinHistory = async (id, the_date, the_date2) => {
    let data = await CoinGeckoClient.coins.fetchHistory(id, {
        'date': the_date
    });
    //      console.log(data.data);
    coin = data.data;
    name = coin.name;
    price = h.numberWithCommas(coin.market_data.current_price.usd.toFixed(3));
    cap = coin.market_data.market_cap.usd;
    vol = coin.market_data.total_volume.usd;
    if (cap > 0) {
        cap_text = "cap: " + h.abbreviateNumber(cap);
    } else {
        cap_text = "cap: ?";
    }

    if (vol > 0) {
        vol = h.abbreviateNumber(vol);
    }

    bot.say(config.channels[0], c.bold(name) + " on " + the_date2 + ": $" + price + " |  vol: " + vol + " | " + cap_text);
};


function showTrending() {

    let url = "https://api.coingecko.com/api/v3/search/trending";

    https.get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);
                coins = json.coins;
                // do something with JSON
                msg = "";
                for (var key in coins) {
                    //item: { id: 'parsiq', name: 'PARSIQ', symbol: 'PRQ', market_cap_rank: 313,
                    coin = coins[key].item;
                    msg += (c.bold(parseInt(key) + 1) + ": " + coin.name) + " - " + coin.symbol + " #" + coin.market_cap_rank + "  ";
                }
                bot.say(config.channels[0], msg);
            } catch (error) {
                console.error(error.message);
            };
        });

    }).on("error", (error) => {
        console.error(error.message);
    });
}

function setIcon(id, icon) {
    let sql = "update coins SET icon = ? where id = ?";
    let params = [icon, id];
    console.log(params);
    db.run(sql, params, function(err) {
        if (err) {
            console.log(err);
            return console.error(err.message);
        }
        bot.say(config.channels[0], "Icon set.");

    });
}

function showDefi() {
    let url = "https://api.coingecko.com/api/v3/global/decentralized_finance_defi";

    https.get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);
                defi = json.data;
                defi_cap = h.abbreviateNumber(parseFloat(defi.defi_market_cap));
                defi_ratio = parseFloat(defi.defi_to_eth_ratio).toFixed(2);
                eth_cap = h.abbreviateNumber(parseFloat(defi.eth_market_cap));
                defi_dom = parseFloat(defi.defi_dominance).toFixed(2);
                defi_vol = h.abbreviateNumber(parseFloat(defi.trading_volume_24h));
                defi_top = defi.top_coin_name;
                defi_top_dom = parseFloat(defi.top_coin_defi_dominance).toFixed(2);
                msg = "Defi cap: " + c.bold(defi_cap) + " (" + defi_ratio + "% of " + eth_cap + " Eth cap) - " + defi_dom + "% overall | " + defi_vol + " vol | Top Coin: " + defi.top_coin_name + " (" + defi_top_dom + "% defi dominance)";
                bot.say(config.channels[0], msg);
            } catch (error) {
                console.error(error.message);
            };
        });

    }).on("error", (error) => {
        console.error(error.message);
    });


}

function showGas() {
    let url = "https://ethgasstation.info/api/ethgasAPI.json?api-key=XXAPI_Key_HereXXX";

    https.get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);
                //{ fast: 710, fastest: 750, safeLow: 540, average: 590, block_time: 16.84, blockNum: 11019973, speed: 0.9956925753689246, safeLowWait: 16.7, avgWait: 2, fastWait: 0.7, fastestWait: 0.6,
                fastest = json.fastest / 10;
                fast = json.fast / 10;
                average = json.average / 10;
                safeLow = json.safeLow / 10;
                fastestW = json.fastestWait;
                fastW = json.fastWait;
                averageW = json.avgWait;
                safeLowW = json.safeLowWait;
                msg = "Gas Station ⛽ (gwei): Fastest " + c.lime(fastest) + " (" + fastestW + "m), Fast " + c.teal(fast) + " (" + fastW + "m), Avg " + c.blue(average) + " (" + averageW + "m), Slow " + c.gray(safeLow) + " (" + safeLowW + "m)";
                bot.say(config.channels[0], msg);
            } catch (error) {
                console.error(error.message);
            };
        });

    }).on("error", (error) => {
        console.error(error.message);
    });
}

var showCoinDev = async (id, icon) => {
    let data = await CoinGeckoClient.coins.fetch(id, {
        'localization': false,
        'developer_data': true,
        'tickers': false,
        'market_data': false,
        'sparkline': false
    });
    //      console.log(data.data);

    coin = data.data;
    name = coin.name;
    forks = coin.developer_data.forks;
    stars = coin.developer_data.stars;
    subscribers = coin.developer_data.subscribers;
    contributors = coin.developer_data.pull_request_contributors;
    commit_count_4_weeks = coin.developer_data.commit_count_4_weeks;
    if (icon != "") {
        name = name + " " + icon;
    }
    bot.say(config.channels[0], c.bold(name + " Dev: ") + contributors + " contributors | " + forks + " forks | " + stars + " stars | " + commit_count_4_weeks + " commits (last 4 weeks)");
};

var showCoinLinks = async (id, icon) => {
    let data = await CoinGeckoClient.coins.fetch(id, {
        'localization': false,
        'developer_data': false,
        'tickers': false,
        'market_data': false,
        'sparkline': false
    });
    //      console.log(data.data);

    coin = data.data;
    name = coin.name;
    links = coin.links;
    homepage = links.homepage[0];
    forum = links.official_forum_url[0];
    chat = links.chat_url[0];
    announce = links.announcement_url[0];
    blockchain = links.blockchain_site[0];
    msg = c.bold(name + ": ");
    if (homepage != "") {
        msg += homepage;
    }
    if (forum != "") {
        msg += " - " + forum;
    }
    if (chat != "") {
        msg += " - " + chat;
    }
    if (announce != "") {
        msg += " - " + announce;
    }
    if (blockchain != "") {
        msg += " - " + blockchain;
    }

    if (icon != "") {
        name = name + " " + icon;
    }

    bot.say(config.channels[0], msg);
};

function showHelp() {
    msg = ".cg <coin> | .cg search <search term> | .cg mm/dd/yyyy <coin> | .cg id <id> |  .cg price <coin> | .cg links <coin> | .cg dev <coin> | .cg icon <coin> <emoji> | .cg trending | .cg defi | .gas";
    bot.say(config.channels[0], msg);
}
