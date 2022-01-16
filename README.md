# Starrybot

## Running

yarn start

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

## TODO

- add a kick command 

- examine the overall flow
- the web page could actually be merged into this back end
- db config env vars could be cleaned up
- rather than a db the roles could be on the blockchain
- litter this code with try catch


## DISCORD TO IMPROVE

- private messages should emojis
- close down command for when the starrybot is kicked so we can delete roles
- having to add the bot twice could be improved
- it would be nicer to know if we knew if a person was an admin or not, this would make it easier for us

