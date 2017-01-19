'use strict';

var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var config = {
  "webhookUrl": "https://testexpresssite.azurewebsites.net",
  "token": "ZjQ5YTNjZDUtMWQxOC00YzkzLWIxODEtNDM1OTAzNjU2MjVkNzg5M2M4ZTItYWIw",
  "port": "8080"
}

var express = require('express');
var app = express();

//Specify a port
var port = process.env.port || 8080;

//Serve up files in public folder
app.use('/', express.static(__dirname + '/public'));

// init flint
var flint = new Flint(config);
flint.start();
console.log("Starting flint, please wait...");

flint.on("initialized", function() {
  console.log("Flint initialized successfully! [Press CTRL-C to quit]");
});

flint.hears('/hello', function(bot, trigger) {
  console.log("/hello fired");
  bot.say('%s, you said hello to me!', trigger.personDisplayName);
});



//Start up the website
var server = app.listen(port);
console.log('Listening on port: ', port);

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

*/
