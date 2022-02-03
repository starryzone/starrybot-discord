async function farewellRejection(req, res, ctx, next) {
  await req.interaction.reply('✨ 👍 🌟');
  res.done();
}

module.exports = {
  farewellRejection,
}
