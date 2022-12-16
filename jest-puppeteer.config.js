module.exports = {
  launch: {
    args: ['--window-size=1280,960'],
    dumpio: true,
    // headless: process.env.HEADLESS !== 'false',
    headless: true,
    product: 'chrome',
  },
  browserContext: 'default'
}
