var Dota2Bot = require("../bot").Dota2Bot
    fs = require("fs"),
    util = require("util");

var GeneralPlugin = Dota2Bot.prototype.Plugins.general = function (bot, options) {
    this.name = "GeneralPlugin";
    this.bot = bot;
    this.debug = bot.debug;
    this.options = options;
    this.bot.on("chatMessage", this.onChatMessage.bind(this));
    this.bot.on("chatCommand", this.onChatCommand.bind(this));
    this.bot.on("ready", this.onDotaReady.bind(this));
}

GeneralPlugin.prototype.onDotaReady = function () {}
GeneralPlugin.prototype.onChatMessage = function (channel, personaName, message, chatObject) {}
GeneralPlugin.prototype.onChatCommand = function (channel, personaName, message, chatObject, args) {
    if (this.commandHandlers.hasOwnProperty(args[0])) {
        console.log('onChatCommand', channel, personaName, message, chatObject, args);
        this.commandHandlers[args[0]].apply(this, [args, channel, personaName, message, chatObject]);
    }
}

var h = GeneralPlugin.prototype.commandHandlers = {};

h['report'] = function (args, channel, personaName, message, chatObject) {
    console.log('general report', args, channel, personaName, message, chatObject, this.bot.config.ownerId64);
    //this.bot.Dota2._client.sendMessage(this.bot.config.ownerId64, personaName + '(' + chatObject.accountId + '): ' + args.slice(1).join(' '));
    this.bot.addUserCommand(chatObject.accountId, 
        new this.bot.Command(
            this.bot.Dota2._client.sendMessage,
            [this.bot.config.ownerId64, personaName + '(' + chatObject.accountId + '): ' + args.slice(1).join(' ')],
            null, null, this.bot.Dota2._client
        )
    );
}