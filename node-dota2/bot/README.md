# Configuration

## core bot config

config_example.json is the bot's basic settings file where you'll need to specify the login info the bot will use. By default index.js will look for a file named config.json, so rename or copy config_example.json.

test_mode: whether to run in test mode. In test mode steam and dota 2 connection is stubbed out.

ownerId: Dota 2 friend ID of owner (lower 32-bits of steam64 ID). Used by bot to identify owner.

ownerId64: Owner's steam64 ID.

cmdChar: Prefix character used to indicate a command.

**TODO:** description of the rest of the options.

## trivia config

By default index.js specifies triviaconfig.json as the config file for the trivia plugin. triviaconfig_example.json is a template showing all the options.

**TODO:** description of options.

## index.js

This is the main application file that initializes the bot, adds the plugins the bot will use, and starts the bot.

# Plugins

**under construction**

For this new version I tried to make the bot more easily extensible and separated bot functionality using a plugin design.
The core bot logic is in bot.js.
It loads the plugins the bot is configured to use. The implementation for specific commands is in plugins.

Everything related to trivia is in the plugins/trivia directory.
