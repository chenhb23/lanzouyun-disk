const path = require('path')
const CracoLessPlugin = require('craco-less')

module.exports = {
  webpack: {
    configure: (config, {env, paths}) => {
      if (env === 'production') {
        config.devtool = false
      }
      console.log('env:', env)
      // 修改 build 输出，双 package.json 必须的改动
      paths.appBuild = path.join(paths.appPath, 'app', 'build')
      config.output.path = paths.appBuild
      // 自定义入口
      paths.appIndexJs = path.join(paths.appSrc, 'renderer', 'index.tsx')
      config.entry = paths.appIndexJs

      // 修改打包类型
      config.target = 'electron-renderer'

      return config
    },
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            // modifyVars: {'@primary-color': '#1DA57A'},
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
}
