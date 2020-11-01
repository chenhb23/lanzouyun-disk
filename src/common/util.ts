import config from '../main/project.config'
import requireModule from "../main/requireModule";

const fs = requireModule('fs-extra')
const path = requireModule('path')
const os = requireModule('os')

export function sizeToByte(size: string | number) {
  if (typeof size === "string") {
    const getUnit = (unit) => ({
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
    }[unit] || 1)
    const [_, num, unit] = size.toLowerCase().replace(' ', '').match(/^(\d+)([kmgt]?)$/)

    return +num * getUnit(unit)
  }

  return size
}

/**
 * 判断是否是分割的文件夹
 */
export function isSpecificFile(name: string) {
  return new RegExp(`^.*${config.signSuffix}$`).test(name)
}

export function createSpecificIndexName(fileName: string, index) {
  return `${fileName}.${`${index}`.padStart(3, '0')}${config.signSuffix}`
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

export const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))
