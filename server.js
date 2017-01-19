'use strict';

var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var config = {
  "webhookUrl": "https://testexpresssite.azurewebsites.net",
  "token": "ZjQ5YTNjZDUtMWQxOC00YzkzLWIxODEtNDM1OTAzNjU2MjVkNzg5M2M4ZTItYWIw",
  "port": 8080
}

//TODO: research why for some reason app.listen does not take the port in the config var
//Specify a port
var port = process.env.port || 8080;

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var Imgflipper = require('imgflipper');
var http = require('http');

var app = express();
app.use(bodyParser.json());

//Serve up files in public folder
app.use('/', express.static(__dirname + '/public'));

/*********************************************************
##  init flint
*********************************************************/
var flint = new Flint(config);
flint.start();
console.log("Starting flint, please wait...");

flint.on("initialized", function() {
  console.log("Flint initialized successfully! [Press CTRL-C to quit]");
});

/*********************************************************
##  add flint event listeners
*********************************************************/
flint.on('message', function(bot, trigger, id) {
  flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
});

//Welcome message when a new room or 1:1 is spawned with the bot
flint.on('spawn', function(bot) {
  //flint.debug('new bot spawned in room: %s', bot.room.title);
  console.log('new bot spawned in room: %s', bot.room.title);
  //presents different messages based on room or 1:1
  if(bot.isGroup){
     bot.say("Hi! To get started just type @Ferb /hello. \n\n\n **Note that this is a 'Group' room. I will wake up only when mentioned.**");
  }else{
    bot.say("Hi! To get started just type hello.");
  };
  bot.repeat;
});

//does not work the first call; triggers when i readd the bot to the same room
//TODO: Understand the events better
flint.on("personEnters", function(bot, person, id) {
	flint.debug('personEnters event in room: "%s"', bot.room.title);

  //presents different messages based on room or 1:1
  if(bot.isGroup){
     bot.say("Hi! To get started just type @Ferb /hello. \n\n\n **Note that this is a 'Group' room. I will wake up only when mentioned.**");
  }else{
    bot.say("Hi! To get started just type hello.");
  };
  bot.repeat;
});

flint.on("membershipCreated", function(membership, id) {

	flint.debug('membershipCreated event in room: "%s" for "%s"', membership.roomId, membership.personEmail);

});

flint.on("membershipDeleted", function(membership, id) {

	flint.debug('membershipCreated event in room: "%s" for "%s"', membership.roomId, membership.personEmail);

});

flint.on('despawn', function(bot) {
	flint.debug('bot despawned in room: "%s"', bot.room.title);
});


flint.hears('/hi', function(bot, trigger) {
  console.log("/hi fired");
  bot.say('Hi %s! How are you today?', trigger.personDisplayName);
});


// define express path for incoming webhooks
app.post('/', webhook(flint));

//Start up the website
var server = app.listen(port);
console.log('Listening on port: ', port);
console.log('Config.Port: ', config.port);


// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
  flint.debug('stopping...');
  server.close();

  flint.stop().then(function() {
    process.exit();
  });

});


/*

{
	"id": "Y2lzY29zcGFyazovL3VzL1dFQkhPT0svYjY3YzAwNTUtZTBhYS00Y2JmLWJjNDctMGI0YTJhNGU4NGVj",
	"name": "MyExpressWebhook",
	"targetUrl": "https://testexpresssite.azurewebsites.net",
	"resource": "all",
	"event": "all",
	"orgId": "Y2lzY29zcGFyazovL3VzL09SR0FOSVpBVElPTi9jZjlhNzMyMC0xZjM3LTQyMGQtYWI0MS1lOGM3Zjg0NjM1NzI",
	"createdBy": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS80NzUwMTcwYi1hYzE0LTQ1OTgtOTc4MC03YTFhZTBhNDAxMmU",
	"appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MzMmM4MDc3NDBjNmU3ZGYxMWRhZjE2ZjIyOGRmNjI4YmJjYTQ5YmE1MmZlY2JiMmM3ZDUxNWNiNGEwY2M5MWFh",
	"ownedBy": "creator",
	"status": "active",
	"created": "2017-01-19T16:04:04.241Z"
}


{
	"id": "Y2lzY29zcGFyazovL3VzL1dFQkhPT0svN2IxMzIzZWUtZjM3NC00OWEzLTk1ZDgtYzZlMTc4MTkxYWFl",
	"name": "FerbLocalWebhook",
	"targetUrl": "https://ferb.localtunnel.me",
	"resource": "all",
	"event": "all",
	"orgId": "Y2lzY29zcGFyazovL3VzL09SR0FOSVpBVElPTi9jZjlhNzMyMC0xZjM3LTQyMGQtYWI0MS1lOGM3Zjg0NjM1NzI",
	"createdBy": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS80NzUwMTcwYi1hYzE0LTQ1OTgtOTc4MC03YTFhZTBhNDAxMmU",
	"appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MzMmM4MDc3NDBjNmU3ZGYxMWRhZjE2ZjIyOGRmNjI4YmJjYTQ5YmE1MmZlY2JiMmM3ZDUxNWNiNGEwY2M5MWFh",
	"ownedBy": "creator",
	"status": "active",
	"created": "2017-01-19T17:18:58.509Z"
}
*/
