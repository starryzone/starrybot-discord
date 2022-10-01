'use strict';

const db = require("./db")
const logger = require("./logger")
const discord = require("./discord") // this should be the only place this is brought in
const logic = require("./logic")

const daodao = require("./astrolabe/daodao");

const express = require('express')
const cors = require('cors')
const app = express()
app.use(express.static('public'))

app.use(cors())

app.enable('trust proxy')
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use((req, res, next) => {
  res.set('Content-Type', 'text/html')
  next()
})

app.post('/starry-backend', async (req, res) => {
  try {
    let results = await logic.hoistInquire(req.body.traveller)
    res.status(200).send(results)
  } catch (err) {
    logger.warn('Error hitting starry-backend', err)
    res.status(400).send({error:"Error hitting back end"})
  }
})

app.post('/starry-test', async (req, res) => {
  try {
    const daoUrl = "https://daodao.zone/dao/juno1czh5dy2kxwwt5hlw6rr2q25clj96sheftsdccswg9qe34m3wzgdswmw8ju";
    let results = await daodao.getCW20InputFromDaoDaoDao(daoUrl);
    console.log(results);
    res.status(200).send(results)
  } catch(err) {
    logger.warn(err);
    res.status(400).send({error: "Error with test endpoint"})
  }
})

app.post('/keplr-signed', async (req, res) => {
  try {
    let results = await logic.hoistFinalize(req.body, discord.client)
    res.status((!results || results.error) ? 400 : 200).send(results)
  } catch (err) {
    logger.warn('Error hitting kelpr-signed', err)
    res.status(400).send({error:"error"})
  }
})

app.post('/token-rule-info', async (req, res) => {
	try {
		let results = await logic.tokenRuleInfo(req.body, discord.client)
		res.status((!results || results.error) ? 400 : 200).send(results)
	} catch (err) {
		logger.warn('Error hitting token-rule-info', err)
		res.status(400).send({error: {
      message: err.message,
      code: err.code
    }})
	}
})

app.get('/health-check', async (req, res) => {
  res.status(200).send()
})

app.get('/metrics', async (req, res) => {
  const metrics = await db.metrics()
  res.status(200).send(metrics)
})

// TODO arguably config could be separate from db so that db would not need to be included here
const PORT = db.myConfig.PORT || process.env.PORT || 80;
const server = app.listen(PORT, () => {
  logger.info(`App listening on port ${PORT}`)
})

module.exports = server
