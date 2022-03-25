module.exports = {
	starryCommandTokenAdd: {
		adminOnly: true,
		name: 'add',
		description: '(Admin only) Add a new token rule',
		config: {
			color: '#FDC2A0',
			title: 'What kind of token?',
			emojiOptions: [
				{
					emoji: '🔗',
					description: 'A native token on a Cosmos chain',
					next: 'addNativeToken',
				},
				{
					emoji: '📜',
					description: 'A cw20 fungible token',
					next: 'addCW20',
				},
				{
					emoji: '🖼',
					description: 'A cw721 non-fungible token (Beta)',
					next: 'addCW721',
				},
				{
					emoji: '⁉',
					description: 'Huh? I\'m confused.',
					next: 'explainTokenTypes',
				}
			]
		}
	}
}
