import {createSpecificIndexName, getSuffix, sizeToByte} from './util'

import type {UploadFile} from '../renderer/store/Upload'

// interface SplitData {
//   path: string
//   isFile: boolean
//   name: string
//   size: number
//   splitFiles: {
//     path: string
//     name: string
//     size: number
//     startByte: number
//     endByte: number
//   }[]
// }

// interface SplitOption {
//   splitSize?: number | string
//   fileSize?: number // 如果从外部传入，则内部不用重新读取一次
//   skipSplit?: boolean // 不分割文件，仅仅获取分割数据，方便上传
// }
/**
 * 返回分割后的路径？
 * @deprecated
 */
/*
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
*/

export interface SplitTaskResult {
  file: UploadFile
  splitFiles: SplitTaskFile[]
}

export interface SplitTaskFile {
  sourceFile: UploadFile
  size: number
  name: string
  startByte?: number
  endByte?: number
}

/**
 * 返回文件分割信息（不进行文件分割）
 */
export function splitTask(file: UploadFile, splitSize: string): SplitTaskResult {
  const fSize = file.size
  const splitByte = sizeToByte(splitSize)

  const info: SplitTaskResult = {file, splitFiles: []}

  if (fSize <= splitByte) {
    info.splitFiles = [
      {
        sourceFile: file,
        size: file.size,
        name: file.name,
      },
    ]
  } else {
    const count = Math.ceil(fSize / splitByte)
    const suffix = getSuffix()
    info.splitFiles = Array.from({length: count}).map((_, i) => {
      const indexName = createSpecificIndexName(file.name, suffix, i + 1, count)
      const startByte = splitByte * i
      const endByte = Math.min(fSize, splitByte * (i + 1) - 1)
      return {
        sourceFile: file,
        size: endByte - startByte,
        name: indexName,
        startByte,
        endByte,
      }
    })
  }

  return info
}
