import Store from 'electron-store'
import {Cookie} from 'tough-cookie'

export interface StoreValues {
  isDev: boolean
  cookies: Cookie[] // 从 session 拿 cookie。| 不行，要作为打开 app 时跳转的依据
  downloads: string // 下载路径 // 如果没有设置，从主线程拿 downloads
  // referrer: string
}

/**
 * 如果没有 __internal_.migrations.version,
 * 则会执行 new Store 的 migrations version 直到当前版本
 *
 * 如果 package 的 version 为 2.0.0, 是不会执行 2.0.1 的 migrations！
 * 之后，会把 __internal__.migrations.version 设置为 2.0.0(当前版本号)
 *
 * 如果是从高版本到低版本，则不会执行 migrations
 */
const store = new Store<StoreValues>({
  // watch: true,
  // cwd: '__dirname9', // 渲染线程和主线程两个进程的 cwd 不一样
  migrations: {
    '2.0.0': s => {
      s.delete('cookie' as any)
    },
  },
})

export default store
