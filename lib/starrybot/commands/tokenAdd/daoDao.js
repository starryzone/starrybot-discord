module.exports = {
  daoDao: {
    next: 'handleCW20Entry',
    prompt: {
      type: 'input',
      title: 'Check out DAODAO',
      description: 'If you have not set up a DAO, visit the link above to create a DAO with a governance token.',
      fields: [
        {
          name: '🧑‍🤝‍🧑', // a big space
          value: '☯',
          inline: false,
        },
        {
          name: "Paste your DAODAO URL and we'll take care of the rest!",
          value: "(For example, it'll look something like https://daodao.zone/dao/juno156vlvprfxc4yyu26ute4hu6tjq96pxgt5qqmm0zlt4y0khjetvhqdhmgdm)",
        }
      ],
      url: 'https://daodao.zone'
    }
  }
}
