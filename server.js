'use strict';
const express = require('express');
const app = express();
app.use(express.static('public'))
//app.get('/', (req, res) => { res.status(200).send('<h1>Hello, world!</h1>').end(); });
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
module.exports = app;

/////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
const http = require("http");
const port = process.env.PORT || 8080;

const requestListener = function (req, res) {
    res.writeHead(200)
    res.end("<h1>QUEENBOT: A DISCORD BOT</h1>")
}

const server = http.createServer(requestListener)
server.listen(port)
*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////

const { Client, Intents } = require('discord.js')

const intents = new Intents([
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
]);

const client = new Client({intents: intents }) 
const config = require("./auth.json")

client.on("ready", () => {
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`)
});

client.on("message", async message => {
	if(message.author.bot) return
	message.channel.send("saw message")
	if(message.content.indexOf(config.prefix) !== 0) return
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()
	if(command === "ping") {
	const m = await message.channel.send("Ping?")
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`)
	}
});

client.login(config.token)
