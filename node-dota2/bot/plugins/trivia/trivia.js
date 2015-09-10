var Dota2Bot = require("../../bot").Dota2Bot
    fs = require("fs"),
    util = require("util"),
    Round = require("./round.js").Round,
    UserCollection = require("./user.js").UserCollection;

var TriviaPlugin = Dota2Bot.prototype.Plugins.trivia = function (bot, options) {
    this.name = "TriviaPlugin";
    this.bot = bot;
    this.debug = bot.debug;
    this.options = typeof options == "string" ? this.bot.reloadConfig(options, {}) : options;
    this.bot.on("chatMessage", this.onChatMessage.bind(this));
    this.bot.on("chatCommand", this.onChatCommand.bind(this));
    this.bot.on("ready", this.onDotaReady.bind(this));
    this.bot.on("chatJoined", this.onDotaChatJoined.bind(this));
    this.ready = false;
    this.round = new Round(this);
    this.userCollection = new UserCollection(this.options);
    this.userCollection.on("ready", this.start.bind(this));
}

TriviaPlugin.prototype.start = function () {
    if (this.ready && this.userCollection.ready) {
        util.log('trivia ready, autoStart', this.options.autoStart);
        this.bot.sendMessage(this.options.channel, this.options.startMessage);
        if (this.options.autoStart) this.round.start();
    }
    else {
        console.log('trivia not ready', this.ready, this.userCollection.ready);
    }
}
TriviaPlugin.prototype.onDotaReady = function () {
    console.log('trivia ready');
    if (this.options.hasOwnProperty('channel')) {
        this.bot.joinChat(this.options.channel);
    }
}
TriviaPlugin.prototype.onDotaChatJoined = function (channelData) {
    if (channelData.channelName == this.options.channel) {
        console.log('trivia channel joined');
        this.bot.sendMessage(this.options.channel, this.bot.config.steam_name + " has entered the channel.");
        this.ready = true;
        this.start();
    }
}
TriviaPlugin.prototype.onChatMessage = function (channel, personaName, message, chatObject) {
    if (channel == this.options.channel) this.round.onChatMessage(channel, personaName, message, chatObject);
}
TriviaPlugin.prototype.onChatCommand = function (channel, personaName, message, chatObject, args) {
    if (this.commandHandlers.hasOwnProperty(args[0])) {
        console.log('onChatCommand', channel, personaName, message, chatObject, args);
        
        if (args[0] == 'cancel' || args[0] == 'trivia cancel') {
            this.commandHandlers[args[0]].apply(this, [args, channel, personaName, message, chatObject]);
        }
        else {
            if (channel != this.options.channel) return;
            console.log('chat command', args[0]);
            this.bot.addUserCommand(chatObject.accountId, 
                new this.bot.Command(
                    this.commandHandlers[args[0]],
                    [args, channel, personaName, message, chatObject],
                    null, null, this
                )
            );
        }
        //this.commandHandlers[args[0]].apply(this, [args, channel, personaName, message, chatObject]);
    }
}

var h = TriviaPlugin.prototype.commandHandlers = {};

h['stats'] = h['trivia stats'] = function (args, channel, personaName, message, chatObject) {
	var self = this;
    var userId = chatObject.accountId;
    if (!this.userCollection.ready) return;
	this.userCollection.get(userId, function(user) {
		self.userCollection.getRank(userId, function(rank) {
			if (rank != -1) {
				var message = personaName + ': ' + user.points + ' points, rank ' + rank + ', best streak ' + user.bestStreak + '.';
			}
			else {
				var message = personaName + ': ' + user.points + ' points, unranked, best streak ' + user.bestStreak + '.';
			}
            self.bot.sendMessage(self.options.channel, message);
		});
	}, personaName);
}

h['top'] = h['trivia top'] = function (args, channel, personaName, message, chatObject) {
    var self = this;
    var statType = args[1] || 'all';
    if (!this.userCollection.ready) return;
    this.userCollection.getTop(function (items) {
        console.log(items);
		var message = '';
        if (statType == 'all') {
            message = 'Top 10 all-time: ';
        }
        else {
            message = 'Top 10 past ' + statType + ': ';
        }
		for (var i=0;i<items.length;i++) {
			message += items[i].personaName + ' - ' + (statType == 'all' ? items[i].points : items[i].total) + ', ';
		}
        message = message.substring(0,message.length-2) + '.';
        self.bot.sendMessage(self.options.channel, message);
    }, statType);
}

h['trivia start'] = function (args, channel, personaName, message, chatObject) {
    if (this.userCollection.ready) {
        this.round.start();
    }
    else {
        console.log('userCollection not ready');
    }
}

h['trivia stop'] = function (args, channel, personaName, message, chatObject) {

}

h['cancel'] = h['trivia cancel'] = function (args, channel, personaName, message, chatObject) {
    if (this.round.restartTimer != null) {
        clearTimeout(this.round.restartTimer);
        this.round.restartTimer = null;
        this.round.unansweredCount = 0;
        this.bot.sendMessage(this.options.channel, this.options.keepAliveCancel, this.round.start.bind(this.round));
    }
}

h['question'] = h['trivia question'] = function (args, channel, personaName, message, chatObject) {
    this.bot.sendMessage(this.options.channel, this.round.question);
}