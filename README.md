# Starrybot

## Overview

A collection of services to elevate user privileges in Discord.

## Parts

1. db.js is a based database wrapper - current talks to google cloud postgres database

2. sagan.js generates sagan ipsum

3. winston logger (mandatory for google cloud app engine apps -> make sure to set export GOOGLE_APPLICATION_CREDENTIALS=./winston.json )

4. crypto signing stuff for cosmos ledger

5. vanilla expressjs app that handles backchannel traffic

6. discord.js bot that watches users and lets them into channels based on certain events

## Running

gcloud app deploy

## TODO

- move to cloudflare workers with durable objects?
- move to discord slash commands?

