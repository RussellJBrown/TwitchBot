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
  user:"rokruss",
  host:"localhost",
  database:"twitchdatabase",
  password:"T0r0nt0123",
  port:5432
})

var pg = require('pg');
var betsOpen = false;
var currentBet = "No Current Bets";
var streamer = "rokruss";

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

  if(message.toLowerCase().includes('!join')){
    Join(channel,userstate)
    return
  }

  if(message.toLowerCase().includes('!coinflip')){
    console.log("Input was Coin Flip")
    currentBet = message.replace('!coinflip','');
    coinFlip(channel,userstate,currentBet);
    return;  
  }

  if(message.toLowerCase().includes('!bankamount')){   
    bankAmount(channel,userstate);
    return;
  }
  

  if(message.toLowerCase().includes('!open')){
    openbets(channel,userstate,message);
  }

  if(message.toLowerCase().includes('!close')){
    closebets(channel,userstate);
  }

  if(message.toLowerCase().includes('!bet1')){
    bet1(channel,userstate);
    return;
  }

  if(message.toLowerCase().includes('!bet2')){
    bet2(channel,userstate);
    return;
  }

  if(message.toLowerCase().includes('!wager1')){ 
    wager1(channel,message,userstate);
    return;
  }

  if(message.toLowerCase().includes('!wager2')){
    wager2(channel,message,userstate);
    return;
  }  

  if(message.toLowerCase().includes("!current")){
    returnCurrentBet(channel);

  }

  


  onMessageHandler(channel, userstate, message, self)
})

function onMessageHandler (channel, userstate, message, self) {
  checkTwitchChat(userstate, message, channel)
}


/**
 * When the user inputs !coinflip and a number
 * a 50/50 occurs if they when they get the points if they lose 
 * they los the points
 * @param {*} channel 
 * @param {*} userstate 
 * @param {*} wager 
 */
async function coinFlip(channel, userstate,wager){
    console.log("Create CoinFlip Query")
    var query = "Select money from TwitchBank where username = '" + userstate.username + "' ;";
    console.log(query)
    var value = await coinflipBet(query);
    

    if (parseInt(value) < parseInt(wager)){
      client.say(channel, `@${userstate.username}, You don't have enough points to make that wager`);   
    }

  else{
      var number = Math.round(Math.random())

      if (number<0.5){
        client.say(channel,`@${userstate.username}, You lost the points you bet`);
        var query = "Update TwitchBank set Money = Money - " + wager + " where Username "  + " = '" + userstate.username + "';";
        await connectToDB(query);
      }

      else{
        client.say(channel,`@${userstate.username}, You won the points you bet`);
        var query = "Update TwitchBank set Money = Money + " + wager + " where Username " + " = '" + userstate.username + "';";
        await connectToDB(query);
      }
  }
}

async function bankAmount(channel,userstate){
  console.log("Bank Amount Reached: ")
  var query = "Select Money from TwitchBank where Username = '" + userstate.username+"';";
  console.log(query);
  var value = await coinflipBet(query);
  client.say(channel,`@${userstate.username}, has `+ value)
}

async function bet1(channel,userstate){ 
  if(userstate.username===streamer && betsOpen==true){
    var query = "Select SUM(Wager) from TwitchBank where betNumber = 1;";
    var query2 = "Select SUM(Wager) from TwitchBank where betNumber = 2;";
    
    console.log("First two Queriers")
    var results = await coinflipBet(query);
    var results2 = await coinflipBet(query2);
    console.log("Finished two Queries")

    var payoutAdd = parseInt(results)/(parseInt(results)+parseInt(results2));
    
    var UpdateMoney = "UPDATE TwitchBank set Money = Money + Wager / " + payoutAdd + "where betNumber = 1;";
    await connectToDB(UpdateMoney);
    var ClearBets = "UPDATE TwitchBank set betNumber = 0;";
    await connectToDB(ClearBets);
    var ClearWagers = "UPDATE TwitchBank set Wager = 0;";
    await connectToDB(ClearWagers);
    closebets(channel,userstate);
  }
  else{
    client.say(channel, `@${userstate.username}, You do not have the power to payout a bet.`)
  }


}    

async function bet2(channel,userstate){
  if(userstate.username===streamer && betsOpen==true){
    var query = "Select SUM(Wager) from TwitchBank where betNumber = 1;";
    var query2 = "Select SUM(Wager) from TwitchBank where betNumber = 2;";
    var results = await coinflipBet(query);
    var results2 = await coinflipBet(query2);    
    var payoutAdd = parseInt(results2)/(parseInt(results2)+parseInt(results));
    //var query = "UPDATE Money = money" - payoutAdd + "where betNumber = 1;";
    var UpdateMoney = "UPDATE TwitchBank set Money = Money + Wager /" + payoutAdd + "where betNumber = 2;";
    await connectToDB(UpdateMoney);
    var ClearBets = "UPDATE TwitchBank set betNumber = 0;";
    await connectToDB(ClearBets);
    var ClearWagers = "UPDATE TwitchBank set Wager = 0;";
    await connectToDB(ClearWagers);
    closebets(channel,userstate);
  }
  else{
    client.say(channel, `@${userstate.username}, You do not have the power to payout a bet.`)
  }

}

async function wager1(channel,message,userstate){
  if(betsOpen==true){
    var messUser = message.split(" ");
    var messageUser = messUser[1];
    var query = "Update TwitchBank set betNumber = 1 where Username = '"+userstate.username+"' ;";
    var query2 = "Update TwitchBank set Money = Money - " + messageUser + " where Username = '"+userstate.username+"' ;";
    var query3 = "Update TwitchBank set Wager = Wager + " + messageUser+ " where Username = '"+ userstate.username+"' ;";
    console.log(query);
    console.log(query2);
    console.log(query3);
    await connectToDB(query);
    await connectToDB(query2);
    await connectToDB(query3);
  
  }
  else{
    client.say(channel, `@${userstate.username}, Bets are currently closed right now, try doing a coinflip`)
  }

}

async function wager2(channel,message,userstate){
  if(betsOpen==true){
    var messUser = message.split(" ");
    var messageUser = messUser[1];
    var query = "Update TwitchBank set betNumber = 2 where Username = '"+userstate.username+"' ;";
    var query2 = "Update TwitchBank set Money = Money - " + messageUser+ " where Username = '"+userstate.username+"' ;";
    var query3 = "Update TwitchBank set Wager = Wager +" + messageUser + " where Username = '"+ userstate.username+"' ;";
    console.log(query);
    console.log(query2);
    console.log(query3);
    await connectToDB(query);
    await connectToDB(query2);
    await connectToDB(query3);
  }
  else{
    client.say(channel, `@${userstate.username}, Bets are currently closed right now, try doing a coinflip`)
  }

}

async function Join(channel,userstate){
  var query = "INSERT into TwitchBank (Username,Money,Wager,betNumber) values('"+userstate.username+"',10000,0,0);";
  await connectToDB(query)
}

//Needs to verify that only channel owner can do this command
function openbets(channel,userstate,message){
  if(userstate.username===streamer){
    betsOpen = true;
    currentBet = message.replace("!open","");
    client.say(channel,"Bets are now open: " + currentBet);
  }
  else{
    client.say(channel, `@${userstate.username}, You can not Open Bets`)

  }
}

function closebets(channel,userstate){
  if(userstate.username===streamer){ 
    betsOpen = false;
    currentBet = "No Current Bets";
    client.say(channel,"Bets are now closed");
  }
  else{
    client.say(channel, `@${userstate.username}, You can not Close Bets`)
  }
}

function returnCurrentBet(channel){
  client.say(channel,"The Current Bet is: " + currentBet );

}

async function coinflipBet(query2){
  try{
    await pool.connect()
    
    console.log("Connected Successfully");
    console.log(query2);
    const {rows} = await pool.query(query2);
    

    console.log(rows[0]);  
    var queryedData = JSON.stringify(rows[0]);
    var amount = queryedData.replace(/[^\d.-]/g, '');
    return amount;   
  }
  catch(ex){
    console.log(ex);
  }
  finally{
   // await pool.end()
    console.log("Client Disconnected")
  }
}
async function connectToDB(query2){

  try{
   console.log("Attempting to do query");
    pool.query(query2,(err,res)=>{
    })
    console.log("Connection Ended");

  }
  catch(err){
    console.log(channel,err);
  }

}

setInterval(function() {
  var query = 'Update Bank Set Money = Money + 5';
  connectToDB(query)
}, 300 * 1000);

/*
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
*/
