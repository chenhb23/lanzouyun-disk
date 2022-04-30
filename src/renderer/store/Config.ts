import {makeAutoObservable} from 'mobx'
import {persist} from 'mobx-persist'

type BaseProps<T> = Partial<Pick<T, {[P in keyof T]: T[P] extends (...args: any) => any ? never : P}[keyof T]>>

export class Config {
  @persist domain = '' // https://wwn.lanzouf.com
  @persist lastLogin = '' // "2022-04-23 21:03:29"
  // @persist('list') supportList: string[] = [] // ['tar']
  @persist verification = '' // 188****8888
  @persist maxSize = '100m' // Math.floor(100000000 / 1024 / 1024) // 100M
  splitSize = '100m'

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
