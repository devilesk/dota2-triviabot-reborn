var Dota2Bot = require("../bot").Dota2Bot
    fs = require("fs"),
    util = require("util"),
    MongoClient = require('mongodb').MongoClient;

var ChatLogPlugin = Dota2Bot.prototype.Plugins.chatlog = function (bot, options) {
    this.name = "ChatLogPlugin";
    this.bot = bot;
    this.debug = bot.debug;
    this.options = options;
    this.bot.on("chatMessage", this.logMessage.bind(this));
    this.bot.on("chatCommand", this.logMessage.bind(this));
    this.bot.on("chatSendMessage", this.logMessage.bind(this));
    this.bot.on("ready", this.onDotaReady.bind(this));
    this.ready = false;
    this.db = null;
    this.logCollection = null;
    var self = this;
    
    MongoClient.connect(this.options.databaseAddress + this.options.databaseName, function(err, db) {
        util.log("ChatLog connected to " + self.options.databaseAddress + self.options.databaseName);
        self.db = db;
        self.db.createCollection(self.options.collectionName, self.options.collectionOptions, function (err, collection) {
            if (err) util.log('chatlog collection error');
            self.logCollection = collection;
            self.ready = true;
        });
    });
}

ChatLogPlugin.prototype.onDotaReady = function () {
    console.log('chatlog ready');
}

ChatLogPlugin.prototype.logMessage = function (channel, personaName, message, chatObject) {
    if (!this.ready) return;
    this.logCollection.insert({"createdAt": new Date(), "channel": channel, "message": message, "accountId": chatObject.accountId, "personaName": personaName}, {w:1}, function(err, result) {
        if (err) util.log('insert error logCollection', channel, chatObject.accountId, personaName, message);
    });
}

var h = ChatLogPlugin.prototype.commandHandlers = {};