import {makeAutoObservable} from 'mobx'
import {persist} from 'mobx-persist'
import store from '../../common/store'
import electronApi from '../electronApi'

type BaseProps<T> = Partial<Pick<T, {[P in keyof T]: T[P] extends (...args: any) => any ? never : P}[keyof T]>>

export class Config {
  @persist domain = '' // https://wwn.lanzouf.com
  @persist lastLogin = '' // "2022-04-23 21:03:29"
  // @persist('list') supportList: string[] = [] // ['tar']
  @persist verification = '' // 188****8888
  @persist maxSize = '100m' // Math.floor(100000000 / 1024 / 1024) // 100M
  splitSize = '100m'

  // 是否默认此地址为下载路径
  @persist setDefaultDownloadDir = false
  // 文件下载位置
  @persist downloadDir = ''

  // 主题
  @persist themeSource: Electron.NativeTheme['themeSource']

  // 同时上传/下载数量
  @persist uploadMax = 1
  @persist downloadMax = 2

  // 上传流量警戒线
  @persist uploadWarningSize = 7 // 单位 G
  @persist uploadWarningEnabled = true

  constructor() {
    makeAutoObservable(this)
  }

  // update 过滤空项
  update(data: BaseProps<Config>) {
    // delete data.maxSize
    data = Object.keys(data).reduce((prev, key) => (data[key] ? {...prev, [key]: data[key]} : prev), {})
    if (Object.keys(data).length) {
      Object.assign(this, data)
    }
  }

  // set(data: BaseProps<Config>) {
  //   Object.assign(this, data)
  // }
}

export const config = new Config()
