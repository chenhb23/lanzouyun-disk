const {override} = require('customize-cra')
const path = require('path')

module.exports = {
  webpack: override(config => {
    config.target = 'electron-renderer'
    return config
  }),
  paths: function (paths, env) {
    console.log('env:', env)
    paths.appIndexJs = path.join(paths.appSrc, 'renderer', 'index.tsx')
    return paths
  },
}
