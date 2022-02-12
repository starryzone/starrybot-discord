Fixes #

### Description:

### Suggested QA:

- [ ] Use `/starry farewell` to remove bot, ensure that created roles have been removed
- [ ] Re-add the bot, expect a welcome message
- [ ] Use `/starry token-rule add` normally
  - [ ] Select "Choose a token" normally
  - [ ] Select "I need to make a token" normally
  - [ ] Select the DAODAO option normally
- [ ] Use `/starry token-rule add` incorrectly, expect helpful error
  - [ ] For the first two options, enter invalid cw20 address
  - [ ] For DAODAO option, type in an incorrect URL
- [ ] Use `starry join` flow from an account that *doesn't* have the added token, expect no roles when finished
- [ ] Use `starry join` flow from an account that *does* have the added token, expect all applicable roles to be added

### Further QA:

- [ ] In the middle of a wizard, click on a button from another step, expect a helpful error or it to be ignored
- [ ] Reply to messages that are expecting emoji reaction inputs
- [ ] Kick starrybot (not farewell) and re-add, ensuring normal functioning
