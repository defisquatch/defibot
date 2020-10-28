// Create the configuration
//1. Import coingecko-api
const CoinGecko = require('coingecko-api');

//2. Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

//const sqlite3 = require('sqlite3').verbose();

var db = require('/home/dan/code/defi/db.js');

// Create the bot name

// Listen for any message, say to him/her in the room
//1. Import coingecko-api
//
var func = async () => {
    let data = await CoinGeckoClient.coins.list();
    coins = data.data;
    for (var key in coins) {
        //{ id: 'zumcoin', symbol: 'zum', name: 'ZumCoin' }
        coin = coins[key];
        id = coin.id;
        symbol = coin.symbol;
        name = coin.name;
        let sql = "INSERT INTO coins(id, symbol, name, icon) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM coins WHERE id = ?) ";
        let params = [id, symbol, name, '', id];
        db.run(sql, params, function(err) {
            if (err) {
                console.log(err);
                return console.error(err.message);
            }
        });

    }
};

func();
