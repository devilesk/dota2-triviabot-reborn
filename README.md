# Dota 2 Trivia Bot for Reborn

This is an updated dota 2 trivia bot using [node-dota2](https://github.com/RJacksonm1/node-dota2) and [node-steam](https://github.com/seishun/node-steam).

## Installation

Run `npm install` in bot directory.

## Configuration

### core bot config

config_example.json is the bot's basic settings file where you'll need to specify the login info the bot will use. By default index.js will look for a file named config.json, so rename or copy config_example.json.

test_mode: whether to run in test mode. In test mode steam and dota 2 connection is stubbed out.

ownerId: Dota 2 friend ID of owner (lower 32-bits of steam64 ID). Used by bot to identify owner.

ownerId64: Owner's steam64 ID.

cmdChar: Prefix character used to indicate a command.

**TODO:** description of the rest of the options.

## trivia config

By default index.js specifies triviaconfig.json as the config file for the trivia plugin. triviaconfig_example.json is a template showing all the options.

**TODO:** description of options.

### index.js

This is the main application file that initializes the bot, adds the plugins the bot will use, and starts the bot.

## Plugins

**under construction**

For this new version I tried to make the bot more easily extensible and separated bot functionality using a plugin design.
The core bot logic is in bot.js.
It loads the plugins the bot is configured to use. The implementation for specific commands is in plugins.
It contains the a queue that holds actions requested by all the plugins.
The queue is processed by an interval timer on a delay.

For example, when the trivia plugin generates a message for the bot to say in chat, it will call the bot's sendMessage function in bot.js.
The sendMessage function doesn't send the message immediately, instead it adds it to the dota command queue which is processed by an interval loop in bot.js.
This prevents the bot from spamming too many messages too quickly.
Other actions like joining and leaving channels are also queued.

There is also a separate user command queue to separate user generated bot actions from plugin generated bot actions.
This is so the bot can have tighter control over how often user commands are processed.
User commands can be throttled more strictly without affecting the processing of plugin actions.

Bot.js also handles chat messages by listening to node-dota2's chatMessage event. 
Bot.js then emits its own chatMessage event which plugins are registered to listen to if they want to handle chat messages.
Basically plugins are structured to handle events emitted from the bot.

**TODO:** rewrite this

Everything related to trivia is in the plugins/trivia directory.

## Running the bot

First create the config.json file.
Then check index.js to see that it will initialize the bot with the plugins you want and that the individual plugin configs are correct.
Make sure sentry file exists. If it doesn't, just create a blank file named 'sentry'.
Run `nodejs index.js` to start the bot.
The first time the bot runs it should fail with error code 63 and send a steam guard code to the email of the steam account the bot is using.
Check your email for the steam guard code and update config.json with it.
Run the bot again and it should work.
