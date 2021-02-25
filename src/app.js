import tmi from 'tmi.js'
import { BOT_USERNAME , OAUTH_TOKEN, CHANNEL_NAME, BLOCKED_WORDS } from './constants'

console.log("app started")

const options = {
	options: { debug: true },
	connection: {
    reconnect: true,
    secure: true,
    timeout: 180000,
    reconnectDecay: 1.4,
    reconnectInterval: 1000,
	},
	identity: {
		username: BOT_USERNAME,
		password: OAUTH_TOKEN
	},
	channels: [ CHANNEL_NAME ]
}

var pg = require('pg');
var yourGlobalVariable;

const client = new tmi.Client(options)

client.connect()

// events
client.on('disconnected', (reason) => {
  onDisconnectedHandler(reason)
})

client.on('connected', (address, port) => {
  onConnectedHandler(address, port)
})

client.on('hosted', (channel, username, viewers, autohost) => {
  onHostedHandler(channel, username, viewers, autohost)
})

client.on('subscription', (channel, username, method, message, userstate) => {
  onSubscriptionHandler(channel, username, method, message, userstate)
})

client.on('raided', (channel, username, viewers) => {
  onRaidedHandler(channel, username, viewers)
})

client.on('cheer', (channel, userstate, message) => {
  onCheerHandler(channel, userstate, message)
})

client.on('giftpaidupgrade', (channel, username, sender, userstate) => {
  onGiftPaidUpgradeHandler(channel, username, sender, userstate)
})

client.on('hosting', (channel, target, viewers) => {
  onHostingHandler(channel, target, viewers)
})

client.on('reconnect', () => {
  reconnectHandler()
})

client.on('resub', (channel, username, months, message, userstate, methods) => {
  resubHandler(channel, username, months, message, userstate, methods)
})

client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
  subGiftHandler(channel, username, streakMonths, recipient, methods, userstate)
})

// event handlers

client.on('message', (channel, userstate, message, self) => {
  if(self) {
    return
  }

  if (userstate.username === BOT_USERNAME) {
    console.log(`Not checking bot's messages.`)
    return
  }

	if(message.toLowerCase() === '!hello') {
    hello(channel, userstate);
    return;
  }

  if(message.toLowerCase()==='!play'){
    play(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!adopt'){
    adopt(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!disown'){
    disOwnRock(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!coinflip'){
    cointflip(channel,usertate);
    return;
  }

  if(message.toLowerCase()==='!bankAmount'){
    bankAmount(userstate);
    return;
  }


  if(message.toLowerCase()==='!wagerSetup'){
    wagerSetup(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!bet1'){
    bet1(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!bet2'){
    bet2(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!payout1'){
    payout1(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!payout2'){
    payout2(channel,userstate);
    return;
  }





  onMessageHandler(channel, userstate, message, self)
})

function onMessageHandler (channel, userstate, message, self) {
  checkTwitchChat(userstate, message, channel)
}

function onDisconnectedHandler(reason) {
  console.log(`Disconnected: ${reason}`)
}

function onConnectedHandler(address, port) {
  console.log(`Connected: ${address}:${port}`)
}

function onHostedHandler (channel, username, viewers, autohost) {
  client.say(channel,
    `Thank you @${username} for the host of ${viewers}!`
  )
}

function onRaidedHandler(channel, username, viewers) {
  client.say(channel,
    `Thank you @${username} for the raid of ${viewers}!`
  )
}

function onSubscriptionHandler(channel, username, method, message, userstate) {
  client.say(channel,
    `Thank you @${username} for subscribing!`
  )
}

function onCheerHandler(channel, userstate, message)  {
  client.say(channel,
    `Thank you @${userstate.username} for the ${userstate.bits} bits!`
  )
}

function onGiftPaidUpgradeHandler(channel, username, sender, userstate) {
  client.say(channel,
    `Thank you @${username} for continuing your gifted sub!`
  )
}

function onHostingHandler(channel, target, viewers) {
  client.say(channel,
    `We are now hosting ${target} with ${viewers} viewers!`
  )
}

function reconnectHandler () {
  console.log('Reconnecting...')
}

function resubHandler(channel, username, months, message, userstate, methods) {
  const cumulativeMonths = userstate['msg-param-cumulative-months']
  client.say(channel,
    `Thank you @${username} for the ${cumulativeMonths} sub!`
  )
}

function subGiftHandler(channel, username, streakMonths, recipient, methods, userstate) {

  client.say(channel,
    `Thank you @${username} for gifting a sub to ${recipient}}.`
  )

  // this comes back as a boolean from twitch, disabling for now
  // "msg-param-sender-count": false
  // const senderCount =  ~~userstate["msg-param-sender-count"];
  // client.say(channel,
  //   `${username} has gifted ${senderCount} subs!`
  // )
}

// commands

function hello (channel, userstate) {
  client.say(channel, `@${userstate.username}, heya!`)
}

function play(channel,userstate){
  client.say(channel, `@${userstate.username}, What game do you want to play?`)
}

function adopt(channel,userstate){
  client.say(channel, `@${userstate.username}, Do you wnat to adopt a pet rock?`)
}

function adoptRock(userstate){
  //Figure Out What these values are other than username
  var query = "Insert from RockOwners values('" +userstate.username+"',0,0,0);"
  connectToDB(query);

}

function disOwnRock(userstate){
  var query = "Delete from RockOwners where Owners = " +  userstate.username;
  connectToDB(query);

}

function coinFlip(userstate,wager){
  var query = "Select Money from Bank where Owners = " + userstate;
  var value=0;

  if (value<wager){
    client.say(channel, `@${userstate.username}, You don't have enough points to make that wager`)
  }

  else{
      var number = Math.round(Math.random())

      if (number<0.5){
        client.say(channel,`@${userstate.username}, You lost the points you bet`);
        var newValue = value-wager;
        var query = "UPDATE courses SET Money = '" + userstate.username +"'" + " WHERE Money = " + newValue + ";";
        connectToDB(query);
      }

      else{
        client.say(channel,`@${userstate.username}, You won the points you bet`);
        var newValue = value+wager;
        var query = "UPDATE courses SET Money = '" + userstate.username +"'" + " WHERE Money = " + newValue + ";";
        connectToDB(query)
      }
  }
}

function bankAmount(userstate){
  var query = "Select Money from Bank where Owners = " + userstate;
  connectToDB(query);
  value = 0;
  client.say(channel,`@${userstate.username}, has `+ value)
}

function wagerSetup(channel,userstate){
  var query = "DELETE FROM Wager;";
  var fields = input.split(username.message);
  
}

function bet1(channel,userstate){
  var query = "take points from bank";
  var query2 = "put points into wager bank";

}

function bet2(channel,userstate){
  var query = "take points from bank";
  var query2 = "take points from wager bank"

}

function payout1(channel,userstate){
    var allWinners = "Select Users where Bet = 1";
    var winners = connectToDB(allWinners);
    var i;
    var a = "Select all(first) from Wager;"
    var b = "Select all(second) from Wager;"
    var odds = a/(a+b);
    for(i;i<winners.lenght();i++)
    {
      var query = "Update Bank Set Money = "+ wager/odds +" from Bank where Person = " + winner+";";
      connectToDB(query);
    }
    
}

function paytout2(channel,userstate){
  var allWinners = "Select Users where Bet = 2";
  var winners = connectToDB(allWinners);  
  var i;

  var a = "Select all(second) from Wager;";
  var b = "Select all(first) from Wager;";
  var odds = a/(a+b);

  for(i;i<winners.length();i++){
    var winner = winners[i];
    var wager = wagers[i];
    var query = "Update Bank Set Money = "+  wager/odds  +" from Bank where Person = "+ winner+";";
    connectToDB(query);
  }


}










//Add Catagories here if you want to expand catagories
function redeemCatagories(channel,userstate){
  var catagories = new Array();
  catagories[0] = "Do a voice?";
  catagories[1] = "Request Game?" 
  catagories[2] = "Song Request?"
  return catagories;
}


function whatAreRedeems(channel,userstate){
  var catagores = redeemCatagories(channel,userstate)
  var i;
  var output;
  for (i = 0; i < catagores.length; i++) {
       output +=  String(i+1) + catagories + " "
  } 
    client.say(channel,output)
}


setInterval(function() {
  var query = 'Update Bank Set Money = Money + 5';
  connectToDB(query)
}, 300 * 1000);






function connectToDB(query){
  var connectionString = "postgres://userName:password@serverName/ip:port/nameOfDatabase";
  var pgClient = new pg.Client(connectionString);
  pgClient.connect();
  var query = pgClient.query(query);
  pgClient.end();

}




function checkTwitchChat(userstate, message, channel) {
  console.log(message)
  message = message.toLowerCase()
  let shouldSendMessage = false
  shouldSendMessage = BLOCKED_WORDS.some(blockedWord => message.includes(blockedWord.toLowerCase()))
  if (shouldSendMessage) {
    // tell user
    client.say(channel, `@${userstate.username}, sorry!  You message was deleted.`)
    // delete message
    client.deletemessage(channel, userstate.id)
  }
}
