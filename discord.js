
'use strict';

const db = require("./db")

const logger = require("./logger")

const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions } = require('discord.js')
const {myConfig} = require("./db");

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents })

client.on("ready", () => {
	logger.info(`StarryBot has star(ry)ted.`)
});

client.on("messageCreate", async message => {
	if (message.author.bot) return
	if (message.content.indexOf(db.myConfig.PREFIX) !== 0) return

	// peel a few details out of the message
	const {guildId, author } = message;
	const args = message.content.slice(db.myConfig.PREFIX.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()

	// since this bot serves many masters, go ahead and find which server is involved here
	let disco = db.guildGet(guildId)

	switch(command) {

		case "starry-quote":
			message.channel.send(Sagan.sagan())
			break

		case "starry":
			let uuid = author.id
			const memberExists = await db.memberExists(uuid, guildId);

			if (memberExists.length !== 0) {
				// TODO it may be possible to ask discord rather than asking our own database - more stable
				message.channel.send("You're already validated on this server :)")
				break

			} else {

				// get a funny quote
				let sagan = Sagan.sagan()

				// create a session in db
				let sessionId = await db.memberAdd({
					discord_account_id: uuid,
					discord_guild_id: guildId,
					saganism: sagan
				})

				// tell user to go to validator site
				const exampleEmbed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`Please visit: ${disco.validatorURL+sessionId}`)
					.setURL(url)
					.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
					.setDescription(sagan)
					.setThumbnail('https://i.imgur.com/AfFp7pu.png')
					.setTimestamp()
					.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');

				// send it privately
				await message.author.send({ embeds: [exampleEmbed] });

				// but also tell them to check their dms publically
				await message.channel.send("Check your DM's");

			}

			break

		case "starry-delete":
			// tell them first in case of crash
			await message.channel.send("You've been brought back to earth. (And removed as requested.)")
			// then attempt remove
			await db.memberDelete(author.id, guildId)
			break

		case "starry-admin":
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-validator":
			// TODO RESTRICT
			disco.validatorURL = args[0]
			db.guildSet(disco)
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-channel":
			// TODO RESTRICT
			disco.channelId = args[0]
			db.guildSet(disco)
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-role":
			// TODO RESTRICT
			disco.role = args[0]
			db.guildSet(disco)
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-magic":

///
/// request to our backend, localhost:5000 with info
   //   //   we'll copy the code stuffs below
///      const valid = await Secp256k1.verifySignature(
    //    Secp256k1Signature.fromFixedLength(fromBase64(signature.signature)),
    //    sha256(serializeSignDoc(signed)),
     //   this.accounts[0].pubkey,
     // );
///

			// As a test, immediately add the person who sent the message to the secret channel
			const guild = await client.guilds.fetch(guildId)
			const everyoneRole = guild.roles.everyone
			const channel = await guild.channels.cache.get(disco.channelId)
			await channel.permissionOverwrites.set([{ id: message.author.id , allow: ['VIEW_CHANNEL'] }])
			logger.log("elevated perms")

			// It makes sense to ALSO send them an invite code?
			try {
				const guild = await client.guilds.fetch(guildId);
				const channel = await guild.channels.cache.get(disco.channelId);
				const invite = await channel.createInvite({maxUses: 1 });
				let url = `https://discord.gg/${invite.code}`
				await message.author.send(url)
			} catch(e) {
				logger.error(e)
			}
			logger.log("invite sent")

			// There is an idea of adding a "ROLE" to a user.

//https://discordjs.guide/popular-topics/faq.html#how-do-i-unban-a-user
//const role = interaction.options.getRole('role');
//const member = interaction.options.getMember('target');
//member.roles.add(role);

			if(disco.role) {
				let role = message.guild.roles.cache.find(r => r.name === disco.role)
				if(!role) {
					message.channel.send("Hmm, cannot find role " + disco.role)
				} else {
					let member = message.mentions.members.first();
					message.member.roles.add(role).catch(console.error);
				}
			}
			break
	}

});

const login = async () => {
	const loggedInToken = await client.login(db.myConfig.DISCORD_TOKEN)
	if (loggedInToken !== myConfig.DISCORD_TOKEN) {
		console.warn('There might be an issue with the Discord login')
		return false
	} else {
		return true
	}
}

login().then((res) => {
	if (res) {
		console.log('Connected to Discord')
	} else {
		console.log('Issue connecting to Discord')
	}
})
