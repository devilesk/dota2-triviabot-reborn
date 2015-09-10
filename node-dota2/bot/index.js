var Dota2Bot = require("./bot").Dota2Bot,
    GeneralPlugin = require("./plugins/general").GeneralPlugin,
    AdminPlugin = require("./plugins/admin").AdminPlugin,
    TriviaPlugin = require("./plugins/trivia/trivia").TriviaPlugin,
    ChatLogPlugin = require("./plugins/chatlog").ChatLogPlugin,
    tokenize = require("./common").tokenize;
    
var bot = new Dota2Bot('./config.json');
bot.addPlugin('general', {});
bot.addPlugin('admin', {
    channel: 'admin channel'
});
bot.addPlugin('trivia', './triviaconfig.json');
bot.addPlugin('chatlog', {
    "databaseAddress": "mongodb://localhost/",
    "databaseName": "statsDb",
    "collectionName": "chatlog",
    "collectionOptions": {
        "capped": true,
        "size": 5242880,
        "max": 100
    }
});
//bot.addPlugin('trivia', './triviaconfig2.json');
//bot.on("ready", test);
bot.start();

// command line input for testing
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
    var args = tokenize(chunk);
    console.log(args);
    console.log(args.slice(1).join(' '));
    bot.onDotaChatMessage(args[0], 'bot owner', args.slice(1).join(' '), {accountId:config.ownerId,personaName:'bot owner'});
});

function test() {
    var test_users = [];
    var msgs = ['!question', '!cancel', '!stats', '!top all', '!top', '!top day', '!top week', '!top hour', '!top adfasdfsf', '!question fsdfs', '!stats fsfsfsf', 'fwfaf'];
    for (var i = 0; i < 100; i++) {
        var personaName = (Math.random().toString(36)+'00000000000000000').slice(2, 10+2);
        console.log('test user personaName', personaName);
        test_users.push(personaName);
    }
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    console.log(bot.plugins[2]);
    var answer_prob = .1;
    setInterval(function () {
        var r = Math.random();
        if (r < answer_prob) {
            var message = bot.plugins[2].round.answer;
        }
        else if (r < .2) {
            var message = msgs[Math.floor(Math.random()*msgs.length)];
        }
        else {
            var message = (Math.random().toString(36)+'00000000000000000').slice(2, 10+2);
        }
        //var message = bot.plugins[2].round.answer;
        var rIndex = getRandomInt(0, test_users.length - 1);
        bot.onDotaChatMessage(bot.plugins[2].options.channel, test_users[rIndex], message, {accountId:rIndex,personaName:test_users[rIndex]});
    }, 0);
}