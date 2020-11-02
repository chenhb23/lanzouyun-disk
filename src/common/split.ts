import requireModule from '../main/requireModule'
import {createSpecificIndexName, mkTempDirSync, sizeToByte} from './util'
import config from '../main/project.config'

const fs = requireModule('fs-extra')
const path = requireModule('path')

interface SplitData {
  path: string
  isFile: boolean
  name: string
  size: number
  splitFiles: {
    path: string
    name: string
    size: number
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

    const tempDir = mkTempDirSync()
    fileInfo.isFile = false
    fileInfo.path = tempDir

    const splitFileSize = Math.ceil(fSize / splitByte)
    let finishSize = 0
    for (let i = 0; i < splitFileSize; i++) {
      // todo: 后缀名，表示名
      const specialName = createSpecificIndexName(basename, i + 1)
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
        const rs = fs.createReadStream(filePath, {start: startByte, end: endByte})
        const ws = fs.createWriteStream(writePath)
        rs.pipe(ws)
        rs.on('end', () => {
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
