async function starryCommandTokenEdit(req, res, ctx, next) {
	const { interaction } = req;
  res.done();
}

module.exports = {
  starryCommandTokenEdit: {
    name: 'edit',
    description: 'Edit token rule',
    execute: starryCommandTokenEdit,
  }
}
