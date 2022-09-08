# starrybot

## Getting Started

### Discord Set-up
* Choose an existing Discord Server or make a new Discord Server for local dev
    * You must be an admin of this server, and starrybot must not be in there already
* Click on “New Application” in the [Discord Developer Portal](https://discord.com/developers/applications)
* Go to the “Bot” tab and add a bot
    * (Optional) Untoggle “Public Bot” if you don’t want anyone else adding your bot to discord servers in the meantime
    * Save your changes

### Run the Bot Server
* Run `nvm use`, or otherwise make sure you have node >= 16.6.0
* Run `yarn install` in the root directory
* Run `cp .env.template .env` to make your own copy of environment variables
* Set `DISCORD_TOKEN` in `.env` to the token in the "Bot" tab
* Run `yarn start`

### Add your Bot to your Discord Server
* Go to the "General" tab of your app in the Discord Developer Portal and copy the application ID
* Go to `https://discord.com/oauth2/authorize?client_id=[your application ID]&scope=applications.commands%20bot&permissions=268486720`
    * This code gives the permissions for the bot to:
        * Manage Roles (for /starry token-rule and join commands)
        * Send Messages (for every slash command)
        * Embed Links (for /starry join)
        * Attach Files (for /starry export)
        * Add Reactions (for /starry token-rule commands)
    * Follow the steps to authorize the bot
    * You will need to kick the bot a lot for testing, so keep this URL around
* Your bot should be successfully added to the server!
* Follow the steps in the welcome message to re-authorize the bot to enable slash commands

---

## Other Runbooks

### Get Juno Testnet tokens for testing
* Make sure you have [Keplr for Chrome](https://www.keplr.app/) installed (doesn't work on Brave)
* Click on "Enter the app" at https://daodao.zone/
* Hit "Connect Wallet" to add Juno Testnet to your Keplr
* Go to the [Juno Discord server](https://discord.gg/4a8PRXNc)
* (If prompted by a bot) Verify yourself via the DMed instructions
* Open the Keplr Chrome extension (top bar)

    * Hit the dropdown that says “Cosmo”
    * Scroll down to the bottom and click on “Juno Testnet”
* Click on the `junoxyz...` string under your Keplr wallet name to copy the Juno Testnet address
* Paste `$request [your Juno Testnet address]` in #faucet
    * You don’t need to keep the ID in the response - you can always get it later and it doesn’t work the same on testnet anyways
    * You can run this command after some delay (hours/days) to get more for testing if needed

---

## Overview

A collection of services to elevate user privileges in Discord.

## How it works

The way this works is:

1. discord.js registers with discord in general once, and watches for events.

2. discord.js watches for "guildCreate" messages which means that a person running a discord room would like to add starrybot to their room. We go ahead and add starrybot to the room on request. That interaction is a bit complex: it prints a button to the discord channel, and when the administrator clicks on the button it goes ahead and builds some roles and registers some slash commands and also starts tracking those roles in our database.

3. discord.js now watches for user commands and does a few fun things, it lets users elevate their perms, by sending those users to a wallet verification webpage where they validate their wallet.

4. sagan.js is used to help generate the sagan ipsum

5. server.js watches for messages back from the wallet verification webpage.

## Useful links:

- [Adding the Discord bot](https://discord.com/oauth2/authorize?client_id=911363833925349456&scope=bot&permissions=8)

## Props

Props to Todd Wallar for the fun project https://github.com/omniverse/saganipsum.

## TODO

- add a kick command 

- examine the overall flow
- the web page could actually be merged into this back end
- db config env vars could be cleaned up
- rather than a db the roles could be on the blockchain
- litter this code with try catch
- migration scripts can only be run after the bot has been run successfully once (i.e. db.js has already created the tables)

## DISCORD TO IMPROVE

- private messages should emojis
- close down command for when the starrybot is kicked so we can delete roles
- having to add the bot twice could be improved
- it would be nicer to know if we knew if a person was an admin or not, this would make it easier for us

---
## Debugging Tips

**Problem**: `Error [DISALLOWED_INTENTS]: Privileged intent provided is not enabled or whitelisted.`  
**Answer**: Bot intents aren’t set in the dev portal correctly

**Problem**: Server is showing error messages about Knex schema migration  
**Answer**: Need to set up Postgres locally and add the environment variables to your .env

**Problem**: Can’t see "Add to Server" button after clicking on the bot in the Discord Server users list  
**Answer**: You have an older version of Discord, upgrade and try again
