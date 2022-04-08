// This is copy-pasted from farewellRejection, but not
// going to refactor until the pattern is clearer
async function removeRejection(req, res, ctx, next) {
  await req.interaction.reply('✨ 👍 🌟');
  res.done();
}

module.exports = {
  removeRejection,
}
