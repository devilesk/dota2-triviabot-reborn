var Dota2 = require("../index"),
    fs = require("fs"),
    path = require('path'),
    util = require("util"),
    ByteBuffer = require('bytebuffer'),
    ProtoBuf = require('protobufjs'),
    // Schema = require('protobuf').Schema,
    // base_gcmessages = new Schema(fs.readFileSync(__dirname + "/../generated/base_gcmessages.desc")),
    // gcsdk_gcmessages = new Schema(fs.readFileSync(__dirname + "/../generated/gcsdk_gcmessages.desc")),
    // dota_gcmessages_client = new Schema(fs.readFileSync(__dirname + "/../generated/dota_gcmessages_client.desc")),
    protoMask = 0x80000000;

ProtoBuf.convertFieldsToCamelCase = true;

var builder = ProtoBuf.newBuilder();
ProtoBuf.loadProtoFile(path.join(__dirname + "/../generated/base_gcmessages.proto"), builder);
ProtoBuf.loadProtoFile(path.join(__dirname + "/../generated/gcsdk_gcmessages.proto"), builder);
ProtoBuf.loadProtoFile(path.join(__dirname + "/../generated/dota_gcmessages_client.proto"), builder);
var schema = builder.build();

// Methods

Dota2.Dota2Client.prototype.joinChat = function(channel, type) {
  type = type || Dota2.DOTAChatChannelType_t.DOTAChannelType_Custom;

  /* Attempts to join a chat channel.  Expect k_EMsgGCJoinChatChannelResponse from GC */
  if (!this._gcReady) {
    if (this.debug) util.log("GC not ready, please listen for the 'ready' event.");
    return null;
  }

  if (this.debug) util.log("Joining chat channel: " + channel, type);
  // var payload = dota_gcmessages_client.CMsgDOTAJoinChatChannel.serialize({
    // "channelName": channel,
    // "channelType": type
  // });
  var payload = new schema.CMsgDOTAJoinChatChannel({
    "channelName": channel,
    "channelType": type
  }).encode().toBuffer();

  this._client.toGC(this._appid, (Dota2.EDOTAGCMsg.k_EMsgGCJoinChatChannel | protoMask), payload);
};

Dota2.Dota2Client.prototype.leaveChat = function(channel) {
  /* Attempts to leave a chat channel. GC does not send a response. */
  if (!this._gcReady) {
    if (this.debug) util.log("GC not ready, please listen for the 'ready' event.");
    return null;
  }

  var channelId = this.chatChannels.filter(function (item) {if (item.channelName == channel) return true; }).map(function (item) { return item.channelId; })[0]
  if (this.debug) util.log("Leaving chat channel: " + channel, channelId);
  if (channelId === undefined) {
    if (this.debug) util.log("Cannot leave a channel you have not joined.");
    return;
  }
  // var payload = dota_gcmessages_client.CMsgDOTALeaveChatChannel.serialize({
    // "channelId": channelId
  // });
  var payload = new schema.CMsgDOTALeaveChatChannel({
    "channelId": channelId
  }).encode().toBuffer();

  this._client.toGC(this._appid, (Dota2.EDOTAGCMsg.k_EMsgGCLeaveChatChannel | protoMask), payload);
};

Dota2.Dota2Client.prototype.leaveChatById = function(channelId) {
  /* Attempts to leave a chat channel. GC does not send a response. */
  if (!this._gcReady) {
    if (this.debug) util.log("GC not ready, please listen for the 'ready' event.");
    return null;
  }
  
  if (this.debug) util.log("Leaving chat channelId: ", channelId);
  if (channelId === undefined) {
    if (this.debug) util.log("Cannot leave a channel you have not joined.");
    return;
  }

  var payload = new schema.CMsgDOTALeaveChatChannel({
    "channelId": channelId
  }).encode().toBuffer();

  this._client.toGC(this._appid, (Dota2.EDOTAGCMsg.k_EMsgGCLeaveChatChannel | protoMask), payload);
};

Dota2.Dota2Client.prototype.sendMessage = function(channel, message) {
  /* Attempts to send a message to a chat channel. GC does not send a response. */
  if (!this._gcReady) {
    if (this.debug) util.log("GC not ready, please listen for the 'ready' event.");
    return null;
  }

  if (this.debug) util.log("Sending message to", channel, "|", message);
  var channelId = this.chatChannels.filter(function (item) {if (item.channelName == channel) return true; }).map(function (item) { return item.channelId; })[0]
  if (channelId === undefined) {
    if (this.debug) util.log("Cannot send message to a channel you have not joined.");
    return;
  }
  // var payload = dota_gcmessages_client.CMsgDOTAChatMessage.serialize({
    // "channelId": channelId,
    // "text": message
  // });
  var payload = new schema.CMsgDOTAChatMessage({
    "channelId": channelId,
    "text": message
  }).encode().toBuffer();

  this._client.toGC(this._appid, (Dota2.EDOTAGCMsg.k_EMsgGCChatMessage | protoMask), payload);
  this.emit("chatSendMessage", channel, message);
};

Dota2.Dota2Client.prototype.compareChannelId = function (a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// Handlers

var handlers = Dota2.Dota2Client.prototype._handlers;

handlers[Dota2.EDOTAGCMsg.k_EMsgGCJoinChatChannelResponse] = function onJoinChatChannelResponse(message) {
  /* Channel data after we sent k_EMsgGCJoinChatChannel */
  //var channelData = dota_gcmessages_client.CMsgDOTAJoinChatChannelResponse.parse(message);
  var channelData = schema.CMsgDOTAJoinChatChannelResponse.decode(message);
  this.chatChannels.push(channelData);
  this.emit("chatJoined", channelData);
};

handlers[Dota2.EDOTAGCMsg.k_EMsgGCChatMessage] = function onChatMessage(message) {
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

handlers[Dota2.EDOTAGCMsg.k_EMsgGCOtherJoinedChannel] = function onOtherJoinedChannel(message) {
  // TODO;
};

handlers[Dota2.EDOTAGCMsg.k_EMsgGCOtherLeftChannel] = function onOtherLeftChannel(message) {
  // TODO;
};