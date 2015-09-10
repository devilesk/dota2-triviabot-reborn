var EventEmitter = require('events').EventEmitter,
    fs = require("fs"),
    path = require('path'),
    util = require("util"),
    bignumber = require("bignumber.js"),
    Dota2 = exports;

var Dota2Client = function Dota2Client(steamClient, debug, debugMore) {
  EventEmitter.call(this);

  this.debug = debug || false;
  this.debugMore = debugMore || false;
  this._client = steamClient;
  this._appid = 570;
  this.chatChannels = []; // Map channel names to channel data.
  this._gcReady = false,
  this._gcClientHelloIntervalId = null;

  var self = this;
};
util.inherits(Dota2Client, EventEmitter);

// Expose enums
Dota2Client.prototype.ServerRegion = Dota2.ServerRegion;
Dota2Client.prototype.GameMode = Dota2.GameMode;
Dota2Client.prototype.ToAccountID = function(accid){
  return new bignumber(accid).minus('76561197960265728')-0;
};
Dota2Client.prototype.ToSteamID = function(accid){
  return new bignumber(accid).plus('76561197960265728')+"";
};

// Methods
Dota2Client.prototype.launch = function() {
    console.log('Dota2Client launch', this);
    this._gcReady = true;
    this.emit("ready");
};

Dota2Client.prototype.exit = function() {
  this._gcReady = false;
};
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
Dota2Client.prototype.joinChat = function(channel, type) {
  if (this.debug) util.log("Joining chat channel: " + channel, type);
  var channelData = {
      response: 0,
      channelName: channel,
      channelId: { low: getRandomInt(1, 3000000), high: 0, unsigned: true },
      maxMembers: 5000,
      members: []
  };
  this.chatChannels.push(channelData);
  this.emit("chatJoined", channelData);
};

Dota2Client.prototype.leaveChat = function(channel) {
    if (this.debug) util.log("Leaving chat channel: " + channel);
    var channelId = this.chatChannels.filter(function (item) {if (item.channelName == channel) return true; }).map(function (item) { return item.channelId; })[0]
    if (channelId === undefined) {
        if (this.debug) util.log("Cannot leave a channel you have not joined.");
        return;
    }
};

Dota2Client.prototype.sendMessage = function(channel, message) {
    if (this.debug) util.log("Sending message to", channel, "|", message);
    var channelId = this.chatChannels.filter(function (item) {if (item.channelName == channel) return true; }).map(function (item) { return item.channelId; })[0]
    if (channelId === undefined) {
        if (this.debug) util.log("Cannot send message to a channel you have not joined.");
        return;
    }
};

Dota2Client.prototype.compareChannelId = function (a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

Dota2Client.prototype.onChatMessage = function(message) {
  /* Chat channel message from another user. */
  //var chatData = dota_gcmessages_client.CMsgDOTAChatMessage.parse(message);
  var chatData = schema.CMsgDOTAChatMessage.decode(message);
  this.emit("chatMessage",
    this.chatChannels.filter(function (item) {
        if (Dota2.Dota2Client.prototype.compareChannelId(item.channelId, chatData.channelId)) return true;
    }).map(function (item) { return item.channelName; })[0],
    chatData.personaName,
    chatData.text,
    chatData);
};

// Handlers

var handlers = Dota2Client.prototype._handlers = {};

Dota2.Dota2Client = Dota2Client;
