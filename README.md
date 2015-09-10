# Dota 2 Trivia Bot for Reborn

This is an updated dota 2 trivia bot based on a [node-dota2](https://github.com/RJacksonm1/node-dota2) and [node-steam](https://github.com/seishun/node-steam).

It uses an old version of node-steam (v0.6.8) for now, the latest version is a big rework I haven't upgraded to yet.

To get node-dota2 working for newer versions of nodejs I replaced the protobuf library it uses. chrisdew/protobuf replaced with dcodeIO/Protobuf.js.
[Based on the same switch node-steam made in an earlier version](https://github.com/seishun/node-steam/commit/bb697707d968adce2cda85e8a70760b767ad7286).

This modified node-dota2 only implements the handlers I needed for this bot which are the cache and chat handlers.
I was going to clean things up and submit a pull request, but it seems like [better work is already being done](https://github.com/RJacksonm1/node-dota2/pull/90). I'll keep an eye on that and hopefully I can switch to using that.

## Installation

Run `npm install` in node-dota2 directory

Since this project pulls node-steam from git as a dependency, there's an extra installing from git instruction for node-steam that should be followed.
[See node-steam README Installation section](https://github.com/seishun/node-steam/tree/d92b12e0aa63cde3fa5433a93eafefb752f875cf)
The extra step is to just run `npm install` in node-dota2/node_modules/steam directory.
I actually had to use `npm install --unsafe-perm` although I think that is just something to do with my npm installation.

Run `npm install` in node-dota2/bot directory

## Configuration and running the bot

See README in node-dota2/bot directory.
