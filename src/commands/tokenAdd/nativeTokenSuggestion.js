async function nativeTokenSuggestion(req, res, ctx, next) {
  await req.interaction.reply('🌟 Please fill out this form, friend:\n\nhttps://sfg8dsaynp1.typeform.com/to/RvAbowUd');
  res.done();
}

module.exports = {
  nativeTokenSuggestion,
}
