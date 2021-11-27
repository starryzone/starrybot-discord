'use strict';

const db = require("./db")

const logger = require("./logger")

const discord = require("./discord")

////////////////////////////////
// signing stuff
////////////////////////////////

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64 } = require('@cosmjs/encoding')

function signing_dowork(args) {
	// TODO: the next task to do :)
	return 'I could have access to your database rows because I am a message from the backend. Sincerely, the backend'
}

////////////////////////////////
// business logic
////////////////////////////////


////////////////////////////////
// express app
////////////////////////////////

const express = require('express')
const cors = require('cors')
const app = express()
app.use(express.static('public'))

// There's probably some settings we can customize for cors here
app.use(cors())

app.enable('trust proxy')
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use((req, res, next) => {
	res.set('Content-Type', 'text/html')
	next()
})

app.use(async (req, res, next) => {
	db.ensureDatabaseInitialized()
	next()
})

app.post('/starry-backend', async (req, res) => {

	// TODO
	//
	// https://cosmos-webapp.pages.dev/?traveller=session
	//
	// is this a valid uuid?
	// ask db for carl sagan phrase
	// check time stamp
	// if error then say error
	//
	// if ok then
	//		turn on sign button
	//    signature = please sign this msg
	//    blob = {
	//		  session
	//		  signed message
	//	   	signature
	//    }
	//    send to https://queenbot.uc.r.appspot.com/starry-backend
	//

	console.log('req.body', req.body);

	try {
		// If they didn't send the proper parameter
		if (!req.body.traveller) {
			res.sendStatus(400)
		} else {
			let rowInfo = await db.getRowBySessionToken(req.body.traveller)
			console.log('rowInfo', rowInfo)
			if (rowInfo.length === 0) {
				res.sendStatus(400)
			}

			const createdAt = rowInfo[0].created_at;
			console.log('createdAt', createdAt)
			// TODO: see if they've surpassed their allotted time to respond
			const saganism = rowInfo[0].saganism;
			console.log('saganism', saganism)

			res.send({saganism, createdAt});
			// let results = signing_dowork();
		}
	} catch (e) {
		console.warn('Error hitting starry-backend', e)
	}

})

app.post('/keplr-signed', (req, res) => {
	let allIsGood = true
	if (allIsGood) {

		// TODO if all is good then take the person and hoist them into a role

		res.sendStatus(200)
	} else {
		// Bad Request, you're grounded
		res.sendStatus(400)
	}
})

const PORT = db.myConfig.PORT || 8080;
const server = app.listen(PORT, () => {
	logger.info(`App listening on port ${PORT}`)
})

module.exports = server
