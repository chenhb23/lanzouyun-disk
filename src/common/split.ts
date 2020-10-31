// import * as fs from 'fs'
// import * as path from 'path'
// import * as os from 'os'
import requireModule from "./requireModule";
import {sizeToByte} from "./util"
import config from '../project.config'

const fs = requireModule('fs-extra')
const path = requireModule('path')
const os = requireModule('os')

const signSuffix = config.signSuffix

function createSpecificName(fileName: string, index) {
  return `${fileName}.${`${index}`.padStart(3, '0')}${signSuffix}`
}

function createLanZouTempDir() {
  const lanzouDir = path.resolve(os.homedir(), config.homeTempDir)
  fs.ensureDirSync(lanzouDir)
  return fs.mkdtempSync(lanzouDir + '/')
}

interface SplitData {
  path: string
  isFile: boolean
  name: string
  size: number
  splitFiles: {
    path: string,
    name: string,
    size: number,
    startByte: number
    endByte: number
  }[]
}

interface SplitOption {
  splitSize?: number | string
  fileSize?: number // 如果从外部传入，则内部不用重新读取一次
  skipSplit?: boolean // 不分割文件，仅仅获取分割数据，方便上传
}
/**
 * 返回分割后的路径？
 */
function split(filePath, {splitSize = config.splitSize, fileSize, skipSplit} = {} as SplitOption): Promise<SplitData> {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      reject('文件路径不能为空')
      return
    }

    const fSize = fileSize || fs.statSync(filePath).size
    const basename = path.basename(filePath)
    const fileInfo: SplitData = {
      path: filePath,
      isFile: true,
      name: basename,
      size: fSize,
      splitFiles: [],
    }

    const splitByte = sizeToByte(splitSize)
    if (fSize <= splitByte) {
      resolve(fileInfo)
      return
    }

    const tempDir = createLanZouTempDir();
    fileInfo.isFile = false
    fileInfo.path = tempDir

    const splitFileSize = Math.ceil(fSize / splitByte);
    let finishSize = 0;
    for (let i = 0; i < splitFileSize; i++) {
      // todo: 后缀名，表示名
      const specialName = createSpecificName(basename, i + 1)
      const writePath: string = path.resolve(tempDir, specialName)
      const startByte = splitByte * i
      const endByte = Math.min(fSize, splitByte * (i + 1) - 1)

      fileInfo.splitFiles.push({
        path: writePath,
        size: endByte - startByte,
        name: specialName,
        endByte,
        startByte,
      })

      if (!skipSplit) {
        const rs = fs.createReadStream(filePath, {start: startByte, end: endByte});
        const ws = fs.createWriteStream(writePath)
        rs.pipe(ws)
        rs.on("end", () => {
          if ((finishSize += 1) === splitFileSize) resolve(fileInfo)
        })
      }
    }

    if (skipSplit) {
      resolve(fileInfo)
    }
  })
}

export default split
