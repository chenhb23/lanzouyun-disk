import Store from 'electron-store'
import {Cookie} from 'tough-cookie'

export interface StoreValues {
  isDev: boolean
  cookies: Cookie[]
  downloads: string // 下载路径
  // referrer: string
}

const store = new Store<StoreValues>({
  // watch: true,
  migrations: {
    '>=2.0.0': s => {
      s.delete('cookie' as any)
    },
  },
})

export default store
