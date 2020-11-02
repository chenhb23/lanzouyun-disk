import requireModule from '../../main/requireModule'
import config from '../../main/project.config'
import {createSpecificName, sizeToByte} from '../util'
import split from '../split'
import request from '../request'
import {mkdir} from './mkdir'
import {ReadStream} from 'fs'

const fs = requireModule('fs-extra')
const FormData = requireModule('form-data')
const path = requireModule('path')

interface UploadOptions {
  folderId: FolderId
  filePath: string
  onProgress?: (params: {progress: number; send: number; total: number}) => void
}

async function upload(params: UploadOptions) {
  const {filePath, folderId} = params

  // let bytes = 0
  const fstat = await fs.stat(filePath)
  let fileName = path.basename(filePath)
  const size = fstat.size
  if (size > sizeToByte(config.splitSize)) {
    const splitData = await split(filePath, {fileSize: size, skipSplit: true})
    console.log('splitData', splitData)
    const pFolderId = await mkdir(params.folderId, fileName)

    // todo: add task, then start()
    await Promise.all(
      splitData.splitFiles.map((file, i) => {
        const fr = fs.createReadStream(filePath, {
          // highWaterMark: 0 // 限速
          start: file.startByte,
          end: file.endByte,
        })

        const form = createUploadForm({
          fr,
          size: file.size,
          name: file.name,
          folderId: pFolderId,
          id: `WU_FILE_${i}`,
        })

        return request({
          path: '/fileup.php',
          body: form,
        })
      })
    )
  } else {
    // todo: 单个上传
    console.log(`todo: 单个上传 ${folderId}`)

    // 转换不支持的格式码
    if (config.supportList.every(ext => !fileName.endsWith(`.${ext}`))) {
      fileName = createSpecificName(fileName)
    }

    const fr = fs.createReadStream(filePath, {
      // highWaterMark: 0 // 限速
    })

    const form = createUploadForm({fr, size, folderId, name: fileName})

    await request({
      path: '/fileup.php',
      body: form,
    })
  }
}

export default upload

/**
 * 分割完再上传
 * 上传进度 status update
 * 上传速度： todo
 * */

interface FormOptions {
  fr: ReadStream
  size: number
  name: string
  folderId: FolderId
  id?: string
  type?: string
}
export function createUploadForm(options: FormOptions) {
  const form = new FormData()
  form.append('task', '1')
  form.append('ve', '2')
  form.append('lastModifiedDate', new Date().toString())
  form.append('type', options.type || 'application/octet-stream')
  form.append('id', options.id ?? 'WU_FILE_0')
  form.append('folder_id_bb_n', options.folderId)
  form.append('size', options.size)
  form.append('name', options.name)
  form.append('upload_file', options.fr, options.name)

  return form
}
