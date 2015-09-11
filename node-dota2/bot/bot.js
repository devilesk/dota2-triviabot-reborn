var fs = require("fs");

global.config = JSON.parse(fs.readFileSync('./config.json'));

var sentry = null,
    sentryhash,
    test_mode = config.test_mode,
    EventEmitter = require('events').EventEmitter
    Steam = test_mode ? require('./test/stubs/SteamClient') : require("steam"),
    util = require("util"),
    dota2 = test_mode ? require('./test/stubs/Dota2Client') : require("../"),
    steamClient = new Steam.SteamClient(),
    steamUser = new Steam.SteamUser(steamClient),
    steamFriends = new Steam.SteamFriends(steamClient),
    steamGameCoordinator = new Steam.SteamGameCoordinator(steamClient, 570),
    Dota2 = new dota2.Dota2Client(steamClient, true, true),
    MakeSha = require("./common").MakeSha,
    tokenize = require("./common").tokenize,
    sentrylocation = 'sentry';

if (fs.existsSync(sentrylocation)) {
    sentry = fs.readFileSync(sentrylocation);
    sentryhash = MakeSha(sentry);
    console.log('sentryhash', sentry.length, sentryhash);
}
else {
    sentryfile = null;
}

dota2.Dota2Client.prototype.getChannelByName = function (channel) {
    return this.chatChannels.filter(function (item) {if (item.channelName == channel) return true; })
}
dota2.Dota2Client.prototype.getChannelById = function (channelId) {
    return this.chatChannels.filter(function (item) {if (this.compareChannelId(item.channelId, channelId)) return true; })
}

function Dota2Bot(configPath) {
    EventEmitter.call(this);
    this.configPath = configPath || './config.json';
    this.config = config;
    this.Dota2 = Dota2;
    this.debug = Dota2.debug;
    this.steamClient = steamClient;
    this.plugins = [];
    this.dotaCommandQueue = [];
    this.dotaCommandProcessInterval;
    this.userCommandQueue = [];
    this.userCommandProcessInterval;
	this.userCommandLog = {};
    this.userCommandLogClearInterval;
}
util.inherits(Dota2Bot, EventEmitter);

Dota2Bot.prototype.Plugins = {};

Dota2Bot.prototype.start = function () {
    // Login, only passing authCode if it exists
    var logOnDetails = {
        "account_name": this.config.steam_user,
        "password": this.config.steam_pass,
    };
    console.log('auth_code', this.config.steam_guard_code);
    //sentry = fs.readFileSync('sentry');
    console.log('sentry', sentry);
    //console.log('sentry', MakeSha(sentry));
    if (sentry.length) {
        logOnDetails.sha_sentryfile = MakeSha(sentry);
    }
    else {
        logOnDetails.auth_code = this.config.steam_guard_code;
    }
    console.log('logOnDetails', logOnDetails);
    this.steamClient.on("logOnResponse", this.onSteamLogOn.bind(this))
        .on('sentry', this.onSteamSentry.bind(this))
        .on('servers', this.onSteamServers.bind(this))
    
    this.steamClient.connect();
    this.steamClient.on('connected', function () {
        console.log('steamClient connected', logOnDetails);
        steamUser.logOn(logOnDetails);
    });
    steamUser.on('updateMachineAuth', function (response, callback){
        console.log('updateMachineAuth');
        fs.writeFileSync('sentry', response.bytes);
        callback({ sha_file: MakeSha(response.bytes) });
    });
}

/* Steam logic */
Dota2Bot.prototype.onSteamLogOn = function onSteamLogOn (logonResp){
    console.log('onSteamLogOn');
    if (logonResp.eresult == Steam.EResult.OK) {
        console.log('Logged in.');
        
        steamFriends.setPersonaState(Steam.EPersonaState.Online); // to display your bot's status as "Online"
        steamFriends.setPersonaName(this.config.steam_name); // to change its nickname
        util.log("Logged on.");

        this.Dota2.on("ready", this.onDotaReady.bind(this));
        this.Dota2.on("unready", this.onDotaUnready.bind(this));
        this.Dota2.on("chatMessage", this.onDotaChatMessage.bind(this));
        this.Dota2.on("chatJoined", this.onDotaChatJoined.bind(this));
        this.Dota2.on("chatSendMessage", this.onDotaChatSendMessage.bind(this));
        this.Dota2.on("unhandled", this.onUnhandledMessage.bind(this));
        this.Dota2.launch();
    
    }
    else {
       steamClient.disconnect();  //# <=== Added
       console.log(logonResp.eresult);
    }


}
Dota2Bot.prototype.onSteamSentry = function onSteamSentry(sentry) {
    util.log("Received sentry.");
    fs.writeFileSync('sentry', sentry);
}
Dota2Bot.prototype.onSteamServers = function onSteamServers(servers) {
    util.log("Received servers.");
    fs.writeFile('servers', JSON.stringify(servers));
}

/* Event handlers */
Dota2Bot.prototype.onDotaReady = function () {
    var self = this;
    console.log("Node-dota2 ready.");
    this.dotaCommandProcessInterval = setInterval(this.processDotaCommand.bind(this), this.config.dotaCommandProcessDelay);
    this.userCommandProcessInterval = setInterval(this.processUserCommand.bind(this), this.config.userCommandProcessDelay);
    this.userCommandLogClearInterval = setInterval(function () {
        self.userCommandLog = {};
    }, this.config.userCommandLogClearDelay);
    this.emit("ready");
}
Dota2Bot.prototype.onDotaUnready = function () {
    console.log("Node-dota2 unready.");
}
Dota2Bot.prototype.onDotaChatSendMessage = function (channel, message) {
    this.emit("chatSendMessage", channel, this.config.steam_name, message, {accountId: null});
}
Dota2Bot.prototype.onDotaChatMessage = function (channel, personaName, message, chatObject) {
    util.log([channel, personaName, message].join(", "));
    console.log('onDotaChatMessage', channel, personaName, message, chatObject);
    
    if (message === undefined || !message) return;
    
    // check if message is a command
    if (message.charAt(0) === this.config.cmdChar && message.length > 1) {
        var args = tokenize(message.substring(1));
        
        // if first argument is a plugin name, combine it with the command name to form the full chat command.
        if (this.Plugins.hasOwnProperty(args[0])) {
            args[1] = args[0] + ' ' + args[1];
            this.emit("chatCommand", channel, personaName, message, chatObject, args.slice(1));
        }
        else {
            this.emit("chatCommand", channel, personaName, message, chatObject, args);
        }
    }
    else {
        this.emit("chatMessage", channel, personaName, message, chatObject);
    }
}
Dota2Bot.prototype.onDotaChatJoined = function (channelData) {
    console.log('Dota2Bot.onDotaChatJoined emitting chatJoined event', channelData);
    this.emit("chatJoined", channelData);
}
Dota2Bot.prototype.onUnhandledMessage = function (kMsg) {
    util.log("UNHANDLED MESSAGE " + kMsg);
}

Dota2Bot.prototype.addPlugin = function (pluginName, options) {
    console.log('addPlugin', pluginName);
    var plugin = new Dota2Bot.prototype.Plugins[pluginName](this, options);
    this.plugins.push(plugin);
    return plugin;
}

Dota2Bot.prototype.addUserCommand = function (accountId, command) {
    if (this.userCommandQueue.length < this.config.maxUserCommandQueueSize && !this.userCommandLog.hasOwnProperty(accountId)) {
        if (accountId != this.config.ownerId) this.userCommandLog[accountId] = 1;
        this.userCommandQueue.push(command);
    }
}

Dota2Bot.prototype.reloadConfig = function (configPath, configVar, callback) {
    console.log('reloadConfig', configPath, configVar, callback);
    try {
        var newConfig = JSON.parse(fs.readFileSync(configPath));
        for (var attrname in newConfig) { configVar[attrname] = newConfig[attrname]; }
        //console.log('Config reloaded', newConfig);
        if (callback) callback(true);
    }
    catch (err) {
        console.log('There has been an error parsing your JSON.')
        console.log(err);
        if (callback) callback(false);
    }
    return configVar;
}

/* Command processing */
Dota2Bot.prototype.Command = function (fn, args, callback, condition, context) {
    this.fn = fn;
    this.args = args;
    this.callback = callback;
    this.condition = condition || function () { return true; };
    this.context = context;
    this.execute = function (context) {
        var isValid = this.condition();
        console.log('command execute valid', isValid);
        if (isValid) this.fn.apply(this.context || context, this.args);
        if (this.callback) this.callback.call(this.context || context, isValid);
        return isValid;
    }
}

Dota2Bot.prototype.processUserCommand = function () {
    if (this.userCommandQueue.length > 0) {
        var isValid = this.userCommandQueue.shift().execute(this);
        while (!isValid && this.userCommandQueue.length > 0) {
            isValid = this.userCommandQueue.shift().execute(this);
        }
    }
}

Dota2Bot.prototype.processDotaCommand = function () {
    if (this.dotaCommandQueue.length > 0) {
        var isValid = this.dotaCommandQueue.shift().execute(this);
        while (!isValid && this.dotaCommandQueue.length > 0) {
            isValid = this.dotaCommandQueue.shift().execute(this);
        }
    }
}

Dota2Bot.prototype.joinChat = function (channel, callback, condition) {
    console.log('Dota2Bot joinChat', channel, callback, condition);
    var self = this;
    var joinChannelCallback = function (isValid) {
        /*if (isValid) {
            console.log('joinChannelCallback', self);
            self.Dota2.joinChat(channel);
        }
        if (callback) callback(isValid);*/
        return isValid;
    }
    var joinChannelCondition = function () {
        if (condition) return condition() && self.Dota2.getChannelByName(channel).length == 0;
        return self.Dota2.getChannelByName(channel).length == 0;
    }
    this.dotaCommandQueue.push(new this.Command(this.Dota2.joinChat, [channel], joinChannelCallback, joinChannelCondition, this.Dota2));
}

Dota2Bot.prototype.leaveChat = function (channel, callback, condition) {
    this.dotaCommandQueue.push(new this.Command(this.Dota2.leaveChat, [channel], callback, condition, this.Dota2));
}

Dota2Bot.prototype.leaveChatById = function (channelId, callback, condition) {
    this.dotaCommandQueue.push(new this.Command(this.Dota2.leaveChatById, [channelId], callback, condition, this.Dota2));
}

Dota2Bot.prototype.sendMessage = function (channel, message, callback, condition) {
    this.dotaCommandQueue.push(new this.Command(this.Dota2.sendMessage, [channel, message], callback, condition, this.Dota2));
}

exports.Dota2Bot = Dota2Bot;
