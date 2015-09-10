var Dota2Bot = require("../bot").Dota2Bot
    fs = require("fs"),
    util = require("util");

var AdminPlugin = Dota2Bot.prototype.Plugins.admin = function (bot, options) {
    this.name = "AdminPlugin";
    this.bot = bot;
    this.debug = bot.debug;
    this.options = options;
    try {
        this.permissions = JSON.parse(fs.readFileSync('./admin_permissions.json'));
    }
    catch (err) {
        if (err.code == 'ENOENT') {
            this.permissions = {users: []};
        }
        else {
            console.log('There has been an error parsing your JSON.')
            console.log(err);
        }
    }
    this.bot.on("chatMessage", this.onChatMessage.bind(this));
    this.bot.on("chatCommand", this.onChatCommand.bind(this));
    this.bot.on("ready", this.onDotaReady.bind(this));
    this.bot.on("chatJoined", this.onDotaChatJoined.bind(this));
    this.ready = false;
}

AdminPlugin.prototype.updatePermissionsFile = function () {
    fs.writeFileSync('./admin_permissions.json', JSON.stringify(this.permissions));
}

AdminPlugin.prototype.onDotaReady = function () {
    console.log('admin ready');
    if (this.options.hasOwnProperty('channel')) {
        this.bot.joinChat(this.options.channel);
        //this.bot.sendMessage(this.options.channel, this.bot.config.steam_name + " has joined the channel.");
    }
}
AdminPlugin.prototype.onDotaChatJoined = function (channelData) {
    if (channelData.channelName == this.options.channel) {
        console.log('admin channel joined');
        this.ready = true;
    }
}
AdminPlugin.prototype.onChatMessage = function (channel, personaName, message, chatObject) {}
AdminPlugin.prototype.onChatCommand = function (channel, personaName, message, chatObject, args) {
    if (this.commandHandlers.hasOwnProperty(args[0])) {
        if (chatObject.accountId == this.bot.config.ownerId) {
            this.commandHandlers[args[0]].apply(this, [args, channel, personaName, message, chatObject]);
        }
    }
}

var h = AdminPlugin.prototype.commandHandlers = {};

h['join'] = function (args, channel, personaName, message, chatObject) {
    this.bot.joinChat(args.slice(1).join(' ').replace(/'/g, ''));
}
h['leave'] = function (args, channel, personaName, message, chatObject) {
    this.bot.leaveChat(args.slice(1).join(' ').replace(/'/g, ''));
}
h['leaveById'] = function (args, channel, personaName, message, chatObject) {
    console.log('leaveById', args);
    var channelId = {
        low: parseInt(args[1]),
        high: parseInt(args[2]),
        unsigned: (args[3] === "true")
    };
    util.log(channelId);
    this.bot.leaveChatById(channelId);
}
h['say'] = function (args, channel, personaName, message, chatObject) {
    this.bot.sendMessage(args[1], args.slice(2).join(' ').replace(/'/g, ''));
}
h['channels'] = function (args, channel, personaName, message, chatObject) {
    this.bot.sendMessage(channel, this.bot.Dota2.chatChannels.map(function (item) { return item.channelName; }).join(','));
}
h['reloadconfig'] = function (args, channel, personaName, message, chatObject) {
    var self = this;
    this.bot.reloadConfig(this.bot.configPath, this.bot.config, function (success) {
        var msg = success ? 'Config reloaded.' : 'Config reload failed';
        self.bot.sendMessage(channel, msg);
    });
}