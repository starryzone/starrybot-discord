const { Logtail } = require("@logtail/node");
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

const logger = {
  warn: (msg, ctx) => ctx ? logtail.warn(msg, ctx) : logtail.warn(msg),
  info: (msg, ctx) => ctx ? logtail.info(msg, ctx) : logtail.info(msg),
  log: (msg, ctx) => ctx ? logtail.log(msg, ctx) : logtail.log(msg),
  err: (msg, ctx) => ctx ? logtail.error(msg, ctx) : logtail.error(msg),
  error: (msg, ctx) => ctx ? logtail.error(msg, ctx) : logtail.error(msg),
}

module.exports = logger
