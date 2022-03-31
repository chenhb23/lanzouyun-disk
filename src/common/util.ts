import config from '../project.config'
import requireModule from './requireModule'

const fs = requireModule('fs-extra')
const path = requireModule('path')
const os = requireModule('os')

export const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

// 95.0 M
export function sizeToByte(size: string | number) {
  if (typeof size === 'string') {
    const getUnit = unit =>
      ({
        get b() {
          return 1
        },
        get k() {
          return 1024
        },
        get m() {
          return this.k * 1024
        },
        get g() {
          return this.m * 1024
        },
        get t() {
          return this.g * 1024
        },
      }[unit] || 1) // todo: 1 是有问题的
    const [_, num, unit] = size
      .toLowerCase()
      .replace(' ', '')
      .match(/^(\d+\.?\d*)([bkmgt]?)$/)

    return +num * getUnit(unit)
  }

  return size
}

export function byteToSize(byte: number) {
  const formatSize = (total, persize) => {
    const [integer, decimal = ''] = `${Math.floor((total * 100) / persize) / 100}`.split('.')
    return `${integer}.${decimal.padEnd(2, '0')}`
  }

  if (byte < sizeToByte('1k')) return `0`
  if (byte < sizeToByte('1m')) return `${formatSize(byte, sizeToByte('1k'))} k`
  if (byte < sizeToByte('1g')) return `${formatSize(byte, sizeToByte('1m'))} M`
  if (byte < sizeToByte('1t')) return `${formatSize(byte, sizeToByte('1g'))} G`
}

/**
 * 判断是否是分割的文件夹
 */
export function isSpecificFile(name: string) {
  return new RegExp(`^.*${config.signSuffix}$`).test(name)
}

export function restoreFileName(name: string) {
  if (isSpecificFile(name)) {
    return name.replace(config.signSuffix, '')
  }
  return name
}

export function createSpecificIndexName(fileName: string, index) {
  return `${fileName}.${`${index}`.padStart(3, '0')}.${config.ext}`
}

export function createSpecificName(fileName: string) {
  return `${fileName}${config.signSuffix}`
}

/**
 * 创建临时文件夹
 * todo: async
 */
export function mkTempDirSync() {
  const lanzouDir = path.resolve(os.homedir(), config.homeTempDir)
  fs.ensureDirSync(lanzouDir)
  return fs.mkdtempSync(lanzouDir + '/')
}

export function isFile(name: string) {
  return /\.[0-9a-zA-Z]+$/.test(name)
}

export const debounce = (fn, {time = 200} = {}) => {
  let isEnable = true
  return (...args) => {
    if (isEnable) {
      isEnable = false
      setTimeout(() => (isEnable = true), time)
      return fn(...args)
    }
  }
}
