var EventEmitter = require('events').EventEmitter,
    fs = require("fs"),
    path = require('path'),
    util = require("util"),
    bignumber = require("bignumber.js"),
    Dota2 = exports;

var SteamClient = function SteamClient(steamClient, debug, debugMore) {
  EventEmitter.call(this);
  var self = this;
};
util.inherits(SteamClient, EventEmitter);

// Methods
SteamClient.prototype.logOn = function() {
    console.log('SteamClient logOn', this);
    this.emit("loggedOn");
    this.emit("sentry", fs.readFileSync('./sentry'));
    console.log(fs.readFileSync('./servers'));
    this.emit("servers", [{"host":"208.78.164.9","port":27019},{"host":"208.78.164.13","port":27019},{"host":"208.78.164.13","port":27017},{"host":"208.78.164.13","port":27018},{"host":"208.78.164.14","port":27019},{"host":"208.78.164.14","port":27017},{"host":"208.78.164.14","port":27018},{"host":"208.78.164.10","port":27018},{"host":"208.78.164.9","port":27018},{"host":"208.78.164.10","port":27019},{"host":"208.78.164.9","port":27017},{"host":"208.78.164.10","port":27017},{"host":"208.78.164.12","port":27018},{"host":"208.78.164.12","port":27019},{"host":"208.78.164.12","port":27017},{"host":"72.165.61.186","port":27017},{"host":"208.64.200.201","port":27019},{"host":"208.64.200.201","port":27020},{"host":"208.64.200.204","port":27018},{"host":"72.165.61.188","port":27017},{"host":"208.64.200.205","port":27019},{"host":"72.165.61.175","port":27017},{"host":"208.64.200.137","port":27017},{"host":"72.165.61.174","port":27018},{"host":"72.165.61.174","port":27017},{"host":"208.64.201.176","port":27020},{"host":"208.64.200.202","port":27019},{"host":"208.64.200.203","port":27019},{"host":"208.64.200.202","port":27018},{"host":"208.64.200.201","port":27017},{"host":"208.64.201.176","port":27018},{"host":"208.64.201.176","port":27019},{"host":"208.64.201.169","port":27020},{"host":"72.165.61.185","port":27017},{"host":"208.64.200.203","port":27017},{"host":"208.64.200.202","port":27017},{"host":"208.64.200.204","port":27019},{"host":"208.64.200.203","port":27018},{"host":"72.165.61.175","port":27018},{"host":"208.64.200.137","port":27019},{"host":"208.64.200.205","port":27018},{"host":"208.64.201.169","port":27019},{"host":"208.64.200.205","port":27017},{"host":"208.64.201.169","port":27021},{"host":"208.64.200.204","port":27017},{"host":"208.64.201.176","port":27021},{"host":"208.64.201.169","port":27018},{"host":"208.64.200.137","port":27020},{"host":"72.165.61.187","port":27017},{"host":"208.64.201.176","port":27017},{"host":"208.64.200.137","port":27018},{"host":"208.64.201.169","port":27017},{"host":"208.64.200.201","port":27018},{"host":"146.66.152.14","port":27017},{"host":"162.254.197.43","port":27021},{"host":"162.254.197.43","port":27018},{"host":"146.66.152.13","port":27018},{"host":"146.66.152.14","port":27018},{"host":"162.254.197.41","port":27019},{"host":"162.254.197.41","port":27017},{"host":"162.254.197.43","port":27017},{"host":"162.254.197.43","port":27019},{"host":"162.254.197.41","port":27018},{"host":"162.254.197.43","port":27020},{"host":"162.254.197.41","port":27021},{"host":"146.66.152.14","port":27019},{"host":"146.66.152.13","port":27017},{"host":"146.66.152.12","port":27019},{"host":"146.66.152.10","port":27017},{"host":"162.254.197.41","port":27020},{"host":"146.66.152.10","port":27018},{"host":"146.66.152.15","port":27017},{"host":"162.254.197.40","port":27020},{"host":"162.254.197.42","port":27020},{"host":"162.254.197.40","port":27021},{"host":"146.66.152.12","port":27018},{"host":"162.254.197.42","port":27017},{"host":"146.66.152.12","port":27017},{"host":"146.66.152.10","port":27019},{"host":"162.254.197.42","port":27018}]);
    this.emit("webSessionID");
};
SteamClient.prototype.webLogOn = function() {

}

SteamClient.prototype.setPersonaState = function() {}
SteamClient.prototype.setPersonaName = function() {}

// Handlers

var handlers = SteamClient.prototype._handlers = {};

exports.SteamClient = SteamClient;
exports.EPersonaState = {
    Online: 1
}