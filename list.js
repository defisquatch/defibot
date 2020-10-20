// Create the configuration
//1. Import coingecko-api
const CoinGecko = require('coingecko-api');

//2. Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./db/coingecko.db', sqlite3.OPEN_READWRITE, (err) => {
	  if (err) {
		      console.error(err.message);
		    }
	  console.log('Connected to the chinook database.');
});

// Create the bot name

// Listen for any message, say to him/her in the room
		//1. Import coingecko-api
//
		var func = async() => {
		  let data = await CoinGeckoClient.coins.list();
			coins = data.data;
			for (var key in coins) {
				//{ id: 'zumcoin', symbol: 'zum', name: 'ZumCoin' }
				coin = coins[key];
				id = coin.id;
				symbol = coin.symbol;
				name = coin.name;
				db.run( "INSERT INTO coins(id, symbol, name, icon) VALUES(?, ?, ?, '') WHERE NOT EXISTS (SELECT 1 FROM coins WHERE id = ?) ", id , symbol , name, id );

			}
		};

func();


