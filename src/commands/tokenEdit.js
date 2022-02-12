async function starryCommandTokenEdit(req, res, ctx, next) {
	const { interaction } = req;
  res.done();
}

module.exports = {
  starryCommandTokenEdit: {
    adminOnly: true,
    name: 'edit',
    description: '(Admin Only) Edit token rule',
    execute: starryCommandTokenEdit,
  }
}
