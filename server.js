'use strict';

var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var config = {
  "webhookUrl":  "https://testexpresssite.azurewebsites.net", //"https://ferb.localtunnel.me", //
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
    bot.say("Hi! To get started just type /hello.");
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
    bot.say("Hi! To get started just type /hello.");
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
  let outputString = "```\n{\n  'author':'Jane Rivera <jmrivera@nalco.com>;',\n  'code':'My Express App with Ferb',\n  'description':'S test bot for checking out the Spark APIs',\n  'healthcheck':'GET https://testexpresssite.azurewebsites.net/',\n  'webhook':'POST https://testexpresssite.azurewebsites.net/'\n}\n```"
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
  let personId = trigger.personId;
  let personEmail = trigger.personEmail;
  let personDisplayName = trigger.personDisplayName;
  let outputString = `${personDisplayName} here are some of your information: \n\n\n **Room:** you are in "${roomTitle}" \n\n\n **Room id:** ${roomId} \n\n\n **Email:** your email on file is *${personEmail}* \n\n\n **Person Id:** ${personId}`;
  bot.say("markdown", outputString);
});

flint.hears('/whois',function(bot, trigger){
  console.log("/whois fired");
  //console.log(trigger.mentionedPeople);
  if(trigger.mentionedPeople.length != 2)
  {
      bot.say("Sorry, I cannot proceed if you do not mention a room participant.")
      return;
  }

  var participant = trigger.mentionedPeople[1] ;
  //console.log(participant);
  try{
    //getPersonById has been added by Jane
    flint.getPersonById(participant).then(function(person){
      let personId = person.id;
      let displayName = person.displayName;
      let personEmail = person.email;
      let outputString = `Person Id: ${personId} \n\n Display Name: ${displayName} \n\n Email: ${personEmail}`;
      bot.say("markdown", outputString)
    });
  }
  catch(err){
      bot.say("Unable to get the person information. Usage: @botMention /whois @personMention")
  }

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

/****************************************
## Weather API
****************************************/
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
## Meme Generator
****************************************/
//<editor-fold Meme Generator>
var meme = {

  brace: {id: "61546",desc: "** - Brace yourselves, ... is coming"},
	conspiracy: {id: "61583",desc: "** - Keanu Reeves conspiracy :frowning:"},
	fry: {id: "61520",desc: "** - Not sure if ... or ... :confused:"},
	onedoesnot: {id: "61579",desc: "** - One does not simply"},
	yuno: {id: "61527",desc: "** - Y U No"},
	success: {id: "61544",desc: "** - Success kid"},
	allthethings: {id: "61533",desc: "** - All the things"},
	doge: {id: "8072285",desc: "** - Such wow Much meme"},
	drevil: {id: "40945639",desc: "** - Dr Evil quotes"},
	skeptical: {id: "101711",desc: "** - Skeptical kid"},
	idontalways: {id: "61532",desc: "** - I don't always ... but when I do ..."},
	yodawg: {id: "101716",desc: "** - Yo Dawg"},
	joker: {id: "1790995",desc: "** - And everybody loses their minds"}

}

flint.hears('/meme', function(bot, trigger) {
  console.log("/meme fired");

  var bot_text = trigger.args.slice(1).join(" ");
  //bot.say(bot_text);

  var tags = bot_text.split('"'); //var tags = msg.content.split('"');

  var memetype = tags[0].trim();
  //var memetype = tags[0];
  //console.log(memetype);

  var memeValues = meme[memetype]; //meme['yuno'];
  //console.log(memeValues);
  //console.log(memeValues.id);
  var memeId = memeValues.id;

  //console.log(memeId);

  var top_text = tags[1]?tags[1]:"";
  var bottom_text = tags[3]?tags[3]:"";

  //bot.say("Meme ID is %s - %s, %s", memeId, top_text, bottom_text);

  var imgflipper = new Imgflipper("theeya","theeya");
  imgflipper.generateMeme(memeId, top_text, bottom_text, function(err, url) {
    if(!err)
    {
      bot.say({text: '', file: url});
    }
    else{
      bot.say('Invalid parameters for command - %s', err);
    }
  });

});

flint.hears('/memehelp', function(bot, trigger) {
  console.log("/memehelp fired");
  let outputString = 'Usage: ``/meme memetype "top text" "bottom text"`` \n\n Currently available memes:\n';
  for (var m in meme){
      outputString += "\t\t " + m + " " + meme[m].desc + "\n"
  }

  bot.say("markdown", outputString);
});
//</editor-fold>

/****************************************
 ServiceNow Test
****************************************/
flint.hears('/sn-checkstatus', function(bot, trigger) {
  console.log("/sn-checkstatus fired");
  var ticketNo = trigger.args.slice(1).join(" ");

 //TODO: creation of token when it expires


  var options = { method: 'GET',
    url: 'https://ecolabsandbox.service-now.com/api/now/table/incident',
    qs: { sysparm_limit: '1',
          number: ticketNo,
          sysparm_fields: 'number,sys_id,state,sys_created_by,short_description,priority,active,assignment_group,assigned_to,caller_id'
        },
    headers:
     {
       'cache-control': 'no-cache',
       authorization: 'Bearer LqYAXBdz9pqqPbAKFBhAZpy0g99I0kkmz5I0NJY0czCPDdX0-GrzLYeF9SdAUR46uHL-L64TXkPRlMs8skV7LQ',
       'content-type': 'application/json',
       accept: 'application/json' }
   };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    var jsonbody = JSON.parse(body);
    var sndata = jsonbody.result[0];
    //console.log(jsonbody);

    var snNmber = sndata.number;
    var snDescription = sndata.short_description;
    var snStatus = sndata.state; //map to table
    var snPriority = sndata.priority; //map to table
    var ticketLink = "https://ecolabsandbox.service-now.com/nav_to.do?uri=incident.do?sys_id=" + sndata.sys_id + "%26sysparm_view=ess" ;
    //console.log(snNmber);

    //get user details
    var usersysid = sndata.assigned_to.value;
    usersysid = usersysid?usersysid:"";
    //console.log(usersysid);

    if(usersysid != ""){
      var uoptions = { method: 'GET',
        url: 'https://ecolabsandbox.service-now.com/api/now/table/sys_user',
        qs: { sysparm_limit: '1', sys_id: usersysid },
        headers:
         {
           'cache-control': 'no-cache',
           authorization: 'Bearer LqYAXBdz9pqqPbAKFBhAZpy0g99I0kkmz5I0NJY0czCPDdX0-GrzLYeF9SdAUR46uHL-L64TXkPRlMs8skV7LQ',
           'content-type': 'application/json',
           accept: 'application/json' }
       };

       request(uoptions, function (error, response, body) {
         if (error) throw new Error(error);

         var ujsonbody = JSON.parse(body);
         var usndata = ujsonbody.result[0];
         //console.log(usndata);

         var snAssignedTo = usndata.u_preferred_name;
         var snRepEmail = usndata.email;
         var snRepPhone = usndata.phone;

         //console.log(usndata.u_preferred_name);

         var outputString = `Hi! The ticket [${snNmber}](${ticketLink}) - *${snDescription}* has a status of ${snStatus} and a priority of ${snPriority}. \n\n> The ticket is currently assigned to ${snAssignedTo}.  You can contact the rep at ${snRepEmail} or ${snRepPhone}. `;

         bot.say("markdown", outputString);
         console.log(outputString);
      }); //user request call

    } //endif
    else {
      var outputString = `Hi! The ticket [${snNmber}](${ticketLink}) - *${snDescription}* has a status of ${snStatus} and a priority of ${snPriority}. \n\n > It is currently not assigned yet. `;

      bot.say("markdown", outputString);
      console.log(outputString);
    }

  }); //ticket request call


});

flint.hears('/sn-opentickets', function(bot, trigger) {
  console.log("/sn-opentickets fired");

  var userEmail ="";
  if(trigger.args.length > 1){
    userEmail =  trigger.args.slice(1).join(" ");
  }
  else{
    userEmail = trigger.personEmail
  }

  console.log(userEmail);

  var uoptions = { method: 'GET',
    url: 'https://ecolabsandbox.service-now.com/api/now/table/sys_user',
    qs: { sysparm_limit: '1',
          email: userEmail,
          sysparm_fields: 'sys_id'
        },
    headers:
     {
       'cache-control': 'no-cache',
       authorization: 'Bearer LqYAXBdz9pqqPbAKFBhAZpy0g99I0kkmz5I0NJY0czCPDdX0-GrzLYeF9SdAUR46uHL-L64TXkPRlMs8skV7LQ',
       'content-type': 'application/json',
       accept: 'application/json' }
  };

   request(uoptions, function (error, response, body) {
     if (error) throw new Error(error);

     var ujsonbody = JSON.parse(body);
     var usndata = ujsonbody.result[0];
     var usnSysId = usndata.sys_id;

     //query incident table
     var options = { method: 'GET',
       url: 'https://ecolabsandbox.service-now.com/api/now/table/incident',
       qs: { sysparm_limit: '10',
             sysparm_query: 'state!=7^state!=10',
             caller_id: usnSysId,
             sysparm_fields: 'number,sys_id,state,sys_created_by,short_description,priority,active,assignment_group,assigned_to,caller_id'
           },
       headers:
        {
          'cache-control': 'no-cache',
          authorization: 'Bearer LqYAXBdz9pqqPbAKFBhAZpy0g99I0kkmz5I0NJY0czCPDdX0-GrzLYeF9SdAUR46uHL-L64TXkPRlMs8skV7LQ',
          'content-type': 'application/json',
          accept: 'application/json' }
      };

     request(options, function (error, response, body) {
       if (error) throw new Error(error);

       var jsonbody = JSON.parse(body);
       var sndata = jsonbody.result;
       //console.log(jsonbody);

       var snNmber = "";
       var snDescription = "";
       var ticketLink = "" ;
       var outputString = "Here are the open tickets you've requested: \n\n ";

      //console.log(jsonbody.result);
      //console.log(jsonbody.result[0]);
      //console.log(jsonbody.result[1]);

       for (var t in sndata){
         console.log(sndata[t]);

         snNmber = sndata[t].number;
         snDescription = sndata[t].short_description;
         ticketLink = "https://ecolabsandbox.service-now.com/nav_to.do?uri=incident.do?sys_id=" + sndata[t].sys_id + "%26sysparm_view=ess" ;

           outputString += `[${snNmber}](${ticketLink}) - ${snDescription}  \n`;
       }

      bot.say("markdown", outputString);
     }); //end incident request call

  }); //user request call

});


/******************************************
## SPARK APIs
******************************************/

flint.hears('/room', function(bot, trigger) {
  console.log("/room fired");
  let roomId = "*" + trigger.roomId + "*";
  let roomTitle = "**" + trigger.roomTitle + "**";
  let outputString = `The roomId for room ${roomTitle} is ${roomId}`;
  bot.say("markdown",outputString);
});

//// @botname /createroom <room name>
flint.hears('/createroom', function(bot, trigger) {
  console.log("/createroom fired");
  let roomName = trigger.args.slice(1).join(" ");

  //TODO:  how to parse the different emails from the room name
  let emails = trigger.personEmail;
  bot.newRoom(roomName, emails);

  //bot.say(bot.personId);
});

// @botname /dm <email of person to do 1:1>
//does not work yet
flint.hears('/dm', function(bot, trigger) {
  console.log("/dm fired");
  let dmemail = trigger.args.slice(1).join(" ");
  bot.dm(dmemail, 'dm test: hello world');
});

// @botname /rename <room name>
flint.hears('/renameroom', function(bot, trigger) {
  let oldroomname = trigger.roomTitle;
  console.log("/renameroom fired");
  let roomName = trigger.args.slice(1).join(" ");

  bot.roomRename(roomName)
  .then(function(err) {
    console.log(err.message);
  });
  if(bot.isModerator)
  {
    if(!bot.isGroup){
      bot.say("Cannot rename a 1:1 or Team room.")
    }
    else{
      let outputString = `This room has been renamed from ${oldroomname} to ${roomName}`
      bot.say(outputString);
    }
  }
  else{
    bot.say("I am not a moderator in this room.  I cannot rename the room.")
  }
});

//Remove a room and all memberships.
flint.hears('/implode', function(bot, trigger) {
  if(!bot.isGroup){
    bot.say("Cannot delete a 1:1 or Team room.")
  }
  else{
    bot.implode();
  }

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
//console.log('Config.Port: ', config.port);


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
