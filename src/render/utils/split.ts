import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const signSuffix = '.lzy.zip'

/**
 * 判断是否是分割的文件
 * @returns {boolean}
 */
function isSpecificFile(filePath: string) {
  return new RegExp(`^.*${signSuffix}$`).test(filePath)
}

function createSpecificName(fileName: string, index) {
  return `${fileName}.${`${index}`.padStart(3, '0')}${signSuffix}`
}

function createLanZouTempDir() {
  const lanzouDir = path.resolve(os.homedir(), '.lanzouyun')
  if (!fs.existsSync(lanzouDir)) {
    fs.mkdirSync(lanzouDir)
  }
  return fs.mkdtempSync(lanzouDir + '/')
}

function sizeToByte(size: string | number) {
  if (typeof size === "string") {
    const getUnit = (unit) => ({
      get k() {return 1024},
      get m() {return this.k * 1024},
      get g() {return this.m * 1024},
      get t() {return this.g * 1024},
    }[unit] || 1)
    const [_, num, unit] = size.toLowerCase().match(/^(\d+)([kmgt]?)$/)

    return +num * getUnit(unit)
  }

  return size
}

interface SplitData {
  path: string
  isFile: boolean
  fileName: string
  size: number
}
// todo: 95m
/**
 * 返回分割后的路径？
 */
function split(filePath, size = '75m'): Promise<SplitData> {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      reject('文件路径不能为空')
      return
    }

    const fileSize = fs.statSync(filePath).size
    const basename = path.basename(filePath)
    const fileInfo: SplitData = {path: filePath, isFile: true, fileName: basename, size: fileSize}

    const splitSize = sizeToByte(size)
    if (fileSize <= splitSize) {
      resolve(fileInfo)
      return
    }

    const tempDir = createLanZouTempDir();
    const splitFileSize = Math.ceil(fileSize / splitSize);
    let finishSize = 0;
    for (let i = 0; i < splitFileSize; i++) {
      // todo: 后缀名，表示名
      const rs = fs.createReadStream(filePath, {start: splitSize * i, end: Math.min(fileSize, splitSize * (i + 1) - 1)})
      const ws = fs.createWriteStream(path.resolve(tempDir, createSpecificName(basename, i)))
      rs.pipe(ws)
      rs.on("end", () => {
        if ((finishSize += 1) === splitFileSize) resolve({
          ...fileInfo,
          path: tempDir,
          isFile: false,
        })
      })
    }
  })
}

export default split
