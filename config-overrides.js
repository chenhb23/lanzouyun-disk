const {override} = require('customize-cra')

module.exports = override(
  (config) => {
    config.target = 'electron-renderer'
    return config
  }
)
