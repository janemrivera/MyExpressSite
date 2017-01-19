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




/****************************************
## Process incoming messages
****************************************/

/* On mention with command
ex User enters @botname /hello, the bot will write back
*/
flint.hears('/help', function(bot, trigger) {
  console.log("/help fired");
  let outputString = "I can give you quick access to the available commands:\n- /about\n- /help\n- /hi\n- /hello \n- /room: reveals this room identifier\n- /whoami: shows your spark info\n- /whois @mention: learn about other participants\n"
   bot.say("markdown", outputString);
});

flint.hears('/about', function(bot, trigger) {
  console.log("/about fired");
  let outputString = "```\n{\n  'author':'Jane Rivera &lt;jmrivera@nalco.com&gt;',\n  'code':'helloworld.js on local',\n  'description':'a test bot for checking out the Spark APIs',\n  'healthcheck':'GET https://www.test.com',\n  'webhook':'POST https://www.test.com'\n}\n```"
   bot.say("markdown", outputString);
});

flint.hears('/hello', function(bot, trigger) {
  console.log("/hello fired");
  bot.say('%s, you said hello to me!', trigger.personDisplayName);
});

flint.hears('/hi', function(bot, trigger) {
  console.log("/hi fired");
  bot.say('Hi %s! How are you today?', trigger.personDisplayName);
});

/*
ex "@botname /whoami"
*/
flint.hears('/whoami', function(bot, trigger) {
  console.log("/whoami fired");
  //the "trigger" parameter gives you access to data about the user who entered the command
  let roomId = "*" + trigger.roomId + "*";
  let roomTitle = "**" + trigger.roomTitle + "**";
  let personEmail = trigger.personEmail;
  let personDisplayName = trigger.personDisplayName;
  let outputString = `${personDisplayName} here is some of your information: \n\n\n **Room:** you are in &ldquo;${roomTitle}&rdquo; \n\n\n **Room id:** ${roomId} \n\n\n **Email:** your email on file is *${personEmail}*`;
  bot.say("markdown", outputString);
});

/* On mention with command arguments
ex User enters @botname /echo phrase, the bot will take the arguments and echo them back
*/
flint.hears('/echo', function(bot, trigger) {
  console.log("/echo fired");
  let phrase = trigger.args.slice(1).join(" ");
  let outputString = `Ok, I'll say it: "${phrase}"`;
  bot.say(outputString);
});

flint.hears('/batcave', function(bot, trigger) {
  console.log("/batcave fired");
  var outputString = trigger.args.slice(1).join(" ");
  if(trigger.args.length > 1){
	outputString = `The Batcave echoes, ${outputString}.`;
  }
  else{
	outputString = "The Batcave is silent...";
  }
  bot.say(outputString);
});

flint.hears('/batsignal', function(bot, trigger) {
  console.log("/batsignal fired");
  let outputString = "NANA NANA NANA NANA";
  //bot.say(outputString);
  bot.say({text: outputString, file: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Bat-signal_1989_film.jpg'});

});

flint.hears('/acman', function(bot, trigger) {
  console.log("/acman fired");
  //TODO: try to upload from site - https://upload.wikimedia.org/wikipedia/en/c/c6/Bat-signal_1989_film.jpg
  bot.upload("./img/acman.jpg")
});

// using regex to match across entire message
flint.hears(/(^| )beer( |.|$)/i, function(bot, trigger, id) {
  bot.say('Enjoy a beer, %s! ðŸ»', trigger.personDisplayName);
});

//weather APIs
flint.hears('/weather', function(bot, trigger) {
  // /(^| )weather( |.|$)/i
  //bot.say('Enjoy a beer, %s! ðŸ»', trigger.personDisplayName);

  let city = trigger.args.slice(1).join(" ");
  //let cityEncoded = encodeURI(city);
  //let citynojoin = trigger.args.slice(1);
  //let text2 = trigger.args.slice(2);
  console.log("city: %s", city);

  if(undefined === city || '' === city || null === city)
    {
        bot.say("You forgot the city name.  I am sorry. I cannot guess your city.");
    }
    else{

        var options = {
            protocol : 'http:',
            host : 'api.openweathermap.org',
            path : '/data/2.5/weather?q='+encodeURI(city)+'&units=imperial&appid=f0cdb9e1184eaca0aeb54c211cbc56f3',
            port : 80,
            method : 'GET'
          }

        var request = http.request(options, function(response){
            var body = "";
            response.on('data', function(data) {
              body += data;
              var weather = JSON.parse(body);
			        var weathermain = weather.weather[0].main;

              var temp = weather.main.temp;
              var weatherDesc = weather.weather[0].main + ": " + weather.weather[0].description
              var icon = "http://openweathermap.org/img/w/"+weather.weather[0].icon+".png"
              var image = {"type":"image","originalUrl":icon,"previewUrl":icon};
              var image = JSON.stringify(image)

              console.log("weather : %s", weathermain);

              var wcomment = "";
  				    switch(weather.weather[0].main)
              {
                case "Clear":
                        wcomment = "The weather is mostly sunny.  It's a good idea to wear sunglasses before going out";
                        break;
                case "Clouds":
                case "Cloud":
                        wcomment = "A cloudy day is no match for a sunny disposition. ~ William Arthur Ward";
                        break;
                case "Smoke":
                        wcomment = "There might be limited visibility.  Stay alert.";
                        break;
                case "Rain":
                        wcomment = `I see rain in the forecast.  Please carry an umbrella if you are in ${city}`;
                        break;
                case "Thunderstorm":
                        reaction = "thunder_cloud_and_rain";
                        //bot.reply(message,":"+reaction+":");
                      wcomment = `: Thunderstorm : \n\n Please don't go out if you are in ${city}`;
                        break;
              }

  				    let outputString = `It's ${weathermain} in ${city}. \n \n Temperature: ${temp}F \n \n ${wcomment}`;
  				    //bot.say("markdown", outputString);
              bot.say({text: outputString, file: icon});

            }); //end response.on

            response.on('end', function() {
              /*res.send(JSON.parse(body));*/
            });

        }); //end http.request

          request.on('error', function(e) {
            console.log('Problem with request: %s', e.message);
            bot.say("Sorry, I could not find weather info for city - %s", city);

          });

          request.end();


	} //end else

});




/****************************************
## Handler for unknown commands
****************************************/
// default message for unrecognized commands
flint.hears(/.*/, function(bot, trigger) {
  console.log("Unknown command fired.");
  bot.say('You see a shimmering light, but it is growing dim...');
}, 20);


/****************************************
## Server config & housekeeping
****************************************/
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
