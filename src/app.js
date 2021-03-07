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


const {Pool} = require('pg')
const pool = new Pool({
  user:"",
  host:"localhost",
  database:"twitchdatabase",
  password:"",
  port:5432
})

var pg = require('pg');
var betsOpen = false;
var currentBet = "No Current Bets";

const client = new tmi.Client(options)

client.connect()


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
    hello(channel, userstate)
    return
  }


  if(message.toLowerCase()==='!play'){
    play(channel,userstate)
    return
  }

  if(message.toLowerCase()==='!test'){
    testDatabase(channel,userstate,message,self)
    return
  }


  if(message.toLowerCase()=== '!join'){
    Join(channel,userstate)
    return
  }

  if(message.toLowerCase().includes('!coinflip')){
    console.log("Input was Coin Flip")
    currentBet = message.replace('!coinflip','');
    coinFlip(userstate,currentBet);
    return;  
  }

  if(message.toLowerCase().includes('!bankAmount')){   
    bankAmount(channel,message,userstate);
    return;
  }
  

  if(message.toLowerCase()==='!open'){
    openbets();
  }

  if(message.toLowerCase()==='!close'){
    closebets();
  }



  if(message.toLowerCase()==='!bet1'){
    bet1(channel,message,userstate);
    return;
  }

  if(message.toLowerCase()==='!bet2'){
    bet2(channel,message,userstate);
    return;
  }

  if(message.toLowerCase()==='!payout1'){ 
    payout1(channel,userstate);
    return;
  }

  if(message.toLowerCase()==='!payout2'){
    payout2(channel,message,userstate);
    return;
  }  

  onMessageHandler(channel, userstate, message, self)
})

function onMessageHandler (channel, userstate, message, self) {
  checkTwitchChat(userstate, message, channel)
}

// commands

function gamble(channel,message,userstate){
  currentBet = message.replace('!gamble','');
  openbets();
}

async function coinFlip(userstate,wager){
    console.log("Create CoinFlip Query")
    var query = "Select money from TwitchBank where username = '" + userstate.username + "' ;";
    console.log(query)
    await connectToDB(query);
    //var value=0;

  if (value<parseInt(wager)){
    client.say(channel, `@${userstate.username}, You don't have enough points to make that wager`);   
  }

  else{
      var number = Math.round(Math.random())

      if (number<0.5){
        client.say(channel,`@${userstate.username}, You lost the points you bet`);
        var newValue = value-wager;
        var query = "Update TwitchBank set Money = Money - " + wager + " where Username"  + " = " + userstate.name + ";";
        connectToDB(query);
      }

      else{
        client.say(channel,`@${userstate.username}, You won the points you bet`);
        var newValue = value+wager;
        var query = "Update TwitchBank set Money = Money + " + wager + " where Username" + " = " + userstate.name + ";"
        connectToDB(query)
      }
  }
}

function bankAmount(userstate){
  var query = "Select Money from TwitchBank where Username = " + userstate.username+";";
  connectToDB(query);
  client.say(channel,`@${userstate.username}, has `+ value)
}


function bet1(channel,userstate){ 
  var query = "Select SUM(Wager) from TwitchBank where betNumber = 1;";
  var query2 = "Select SUM(Wager) from TwitchBank where betNumber = 2;";
  results = connectToDB(channel,query);
  results2 = connectToDB(channel,query2);
  payoutAdd = results/(results+results2);
  payoutMinus = results2/(resultls2+results);
  var query = "UPDATE TwitchBank set Money = Money " + payoutAdd + "where betNumber = 1;";
  //var query2 = "UPDATE Money = oney " - payoutMinus + "where betNumber = 2;";
  connectToDB(query);
  connectToDB(query2);
  var ClearBets = "UPDATE TwitchBank set betNumber = 0;";
  connectToDB(ClearBets);
  var query3 = "UPDATE TwitchBank set Wager = 0;";
  connectToDB(query);

}    

function bet2(channel,userstate){
  var query = "Select SUM(Wager) from TwitchBank where betNumber = 1;";
  var query2 = "Select SUM(Wager) from TwitchBank where betNumber = 2;";
  results = connectToDB(channel,query);
  results2 = connectToDB(channel,query2);
  payoutAdd = results/(results+results2);
  payoutMinus = results2/(resultls2+results);
  //var query = "UPDATE Money = money" - payoutAdd + "where betNumber = 1;";
  var query2 = "UPDATE TwitchBank set Money = Money" + payoutMinus + "where betNumber = 2;";
  connectToDB(query);
  connectToDB(query2);
  var ClearBets = "UPDATE TwitchBank set betNumber = 0;";
  connectToDB(ClearBets);
  var query3 = "UPDATE TwitchBank set Wager = 0;";
  connectToDB(query);
}

function wager1(channel,message,userstate){
  var messUser = message.split(" ");
  var messageUser = messUser[1];
  var query = "Update TwitchBank set betNumber = 1 where Username = "+userstate.name+";";
  var query2 = "Update TwitchBank set Money = Money - " + messageUser + " where Username = "+userstate.name+";";
  var query3 = "Update TwitchBank set Wager = Wager " + messageUser+ " where Username = "+ userstate.name+";";
  connectToDB(channel,query);
  connectToDB(channel,query2);
  connection(channel,query3);
  currentBet = "No Current Bets";
}

function wager2(channel,userstate){
  var messUser = message.split(" ");
  var messageUser = messUser[1];
  var query = "Update TwitchBank set betNumber = 2 where Username = "+userstate.name+";";
  var query2 = "Update TwitchBank set Money = Money - " + messageUser+ " where Username = "+userstate.name+";";
  var query3 = "Update TwitchBank set Wager = Wager " + messageUser+ " where Username = "+ userstate.name+";";
  connectToDB(channel,query);
  connectToDB(channel,query2);
  connectToDB(channnel,query3);
  currentBet = "No Current Bets";
}

//Needs to verify that only channel owner can do this command
function openbets(){
  betsOpen = true;
}

function closebets(){
  betsOpen = false;
}

function testDatabase(channel,userstate){
    var query = "INSERT into TwitchBank (username,money,wager,betNumber) values('rokruss',10000,0,0);";     
    connectToDB(channel,query);
}

function Join(channel,userstate){
  var query = "INSERT into TwitchBank (Username,Money,Wager,betNumber) values('"+userstate.username+"',10000,0,0);";
  connectToDB(channel,query)
}

async function connectToDB(query2){
  
  try{
    
    await pool.connect()
    console.log("Connected Successfully")

    const {rows} = await pool.query(query2);
    console.table(rows);
  }

  catch(ex){
    console.log("something went wrong");
  }

  finally{
    await pool.end()
    console.log("Client Disconnected")
  }




  /*try{
   console.log("Attempting to do query");
    pool.query(query2,(err,res)=>{
      console.log(res.rows)
      pool.end()
      return res
    })


    console.log("Connection Ended");

  }
  catch(err){
    console.log(channel,err);
  }
*/
}







setInterval(function() {
  var query = 'Update Bank Set Money = Money + 5';
  connectToDB(query)
}, 300 * 1000);


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
