import config from '../project.config'
import {Request} from 'got'

export const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

// 95.0 M
export function sizeToByte(size: string) {
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

export function byteToSize(byte: number) {
  const formatSize = (total, persize) => {
    const [integer, decimal = ''] = `${Math.floor((total * 100) / persize) / 100}`.split('.')
    return `${integer}.${decimal.padEnd(2, '0')}`
  }

  if (byte < sizeToByte('1k')) return `0`
  if (byte < sizeToByte('1m')) return `${formatSize(byte, sizeToByte('1k'))} K`
  if (byte < sizeToByte('1g')) return `${formatSize(byte, sizeToByte('1m'))} M`
  if (byte < sizeToByte('1t')) return `${formatSize(byte, sizeToByte('1g'))} G`
}

const suffix = ['zip', 'tar', 'rar']
const suffixTypeMap = {
  zip: 'application/zip',
  tar: 'application/x-tar',
  rar: 'application/x-rar',
}
function getRandomItem(list: string[]) {
  return list[Math.round(Math.random() * (list.length - 1))]
}
// 前面不带 .
export function getSuffix() {
  const shortList = config.supportList.filter(value => value.length <= 3)
  return `${getRandomItem(shortList)}.${getRandomItem(suffix)}`
}

export function getFileType(filename: string, defaultType = 'application/octet-stream') {
  const ext = filename.replace(/.+\.(\w+)$/, '$1')
  return suffixTypeMap[ext] || defaultType
}

/**
 * whether it is special file
 * 未命名.png.epub.zip
 */
export function isSpecificFile(name: string) {
  // 兼容老版本
  if (name.endsWith('.lzy.zip')) {
    name = name.replace(/\.lzy\.zip$/, '')
    return !/\d$/.test(name)
  }

  if (suffix.some(value => name.endsWith(`.${value}`))) {
    name = name.replace(/\.\w+?$/, '')
    const ends = config.supportList.find(value => name.endsWith(value))
    if (ends) {
      name = name.replace(new RegExp(`${ends}$`), '')
      return !/\d$/.test(name)
    }
  }
  return false
}

export function isSpecificIndexFile(name: string) {
  // TODO：
  return false
}

export function restoreFileName(name: string) {
  if (isSpecificFile(name)) {
    return name.replace(/\.\w+?\.\w+$/, '')
  }
  return name
}

/**
 * 1.22.3.dmg.t4iso.tar
 * suffix 无需带 .
 */
export function createSpecificIndexName(fileName: string, suffix: string, index: number, total: number) {
  const sign = suffix[suffix.length - 1 - 2]
  const padLength = `${total}`.length
  return `${fileName}.${sign}${`${index}`.padStart(padLength, '0')}${suffix}`
}

export function createSpecificName(fileName: string) {
  return `${fileName}.${getSuffix()}`
}

/**
 * 创建临时文件夹
 * todo: async
 */
// export function mkTempDirSync() {
//   const lanzouDir = path.resolve(os.homedir(), config.homeTempDir)
//   fs.ensureDirSync(lanzouDir)
//   return fs.mkdtempSync(lanzouDir + '/')
// }

export function isFile(name: string) {
  return /\.[0-9a-zA-Z]+$/.test(name)
}

export function streamToText(stream: Request) {
  return new Promise<string>((resolve, reject) => {
    stream.setEncoding('utf-8')
    let data = ''
    stream.on('data', chunk => {
      data += chunk.toString()
    })
    stream.once('end', () => resolve(data))
    stream.once('error', err => reject(err))
  })
}

/**
 * ua 去除 lanzouyun-pan 和 electron 字样
 * 预防被检测
 */
export function safeUserAgent(userAgent: string) {
  const filters = ['lanzouyun-pan', 'electron']
  return Array.from(userAgent.matchAll(/([\w-]+?)\/([\d.]+( \(.+?\))?)/g))
    .filter(value => filters.every(item => item.toLowerCase() !== value[1].toLowerCase()))
    .map(value => value[0])
    .join(' ')
}
