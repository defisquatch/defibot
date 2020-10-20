# defibot
coingecko api irc bot for defi and cryptocurrency

1. cp config.sample.json config.prod.json 
2. vim config.prod.json
3. node defi.js

bot commands

Coin Info
.cg <coin>

Coin Search
.cg search <search term>
  
Coin Historical Price
.cg mm/dd/yyyy <coin>

Coin Info by Id
.cg id <id>

Coin Price Detail
.cg price <coin>

Coin Links 
.cg links <coin>
  
Coin Dev
.cg dev <coin>
  
Set Icon for Coin
.cg icon <coin> <emoji>
  
Trending Coins
.cg trending

Defi Stats
.cg defi
  
Current Ethereum Gas Prices
.gas
