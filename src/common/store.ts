import Store from 'electron-store'

export interface StoreValues {
  isDev: boolean
  cookies: Electron.Cookie[] // 从 session 拿 cookie。| 不行，要作为打开 app 时跳转的依据
  downloads: string // 下载路径 // 如果没有设置，从主线程拿 downloads
  userAgent: string // 和登录的 ua 一致，不然接口无返回数据
  // referrer: string
  lanzouUrl: string
}

/**
 * 如果没有 __internal_.migrations.version,
 * 则会执行 new Store 的 migrations version 直到当前版本
 *
 * 如果 package 的 version 为 2.0.0, 是不会执行 2.0.1 的 migrations！
 * 之后，会把 __internal__.migrations.version 设置为 2.0.0(当前版本号)
 *
 * 如果是从高版本到低版本，则不会执行 migrations
 *
 * 配置文件存储位置: ~/Library/Application Support/lanzouyun-pan/config.json
 */
const store = new Store<StoreValues>({
  // watch: true,
  // cwd: __dirname, // 渲染线程和主线程两个进程的 cwd 不一样
  migrations: {
    '2.0.0': s => {
      s.delete('cookie' as any)
    },
    '2.1.0': s => {
      s.delete('cookies') // 重新登录
    },
    '3.0.0': s => {
      s.delete('cookies') // 使用新的 cookie 类型
    },
    '3.5.0': s => {
      s.delete('cookies') // 重新登录
    },
  },
})

export default store
