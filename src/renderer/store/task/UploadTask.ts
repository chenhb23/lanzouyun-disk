import {TaskStatus} from '../AbstractTask'
import {makeObservable, observable} from 'mobx'
import {BaseTask} from './BaseTask'
import {byteToSize, createSpecificName, delay, sizeToByte} from '../../../common/util'
import {config} from '../Config'
import {supportList} from '../../../project.config'
import {findFolderByName} from '../../../common/core/isExist'
import {mkdir} from '../../../common/core/mkdir'
import {splitTask} from '../../../common/split'
import * as http from '../../../common/http'
import {FormDataEncoder} from 'form-data-encoder'
import {FormData} from 'formdata-node'
import fs from 'fs-extra'
import {Readable} from 'stream'
import path from 'path'

export type UploadFile = {
  size: File['size']
  name: File['name']
  type: File['type']
  path: File['path']
  lastModified: File['lastModified']
}

export interface UploadSubtask {
  name: string // 自定义
  size: number // 自定义
  type: string // 自定义 // todo: delete

  sourceFile: UploadFile

  folderId: FolderId // 小文件为当前目录id，大文件为新建文件的id
  status: TaskStatus
  resolve: number
  startByte?: number
  endByte?: number
}

export class UploadTask implements BaseTask {
  // id = file.path
  folderId: FolderId // = null
  file: UploadFile // = null
  tasks: UploadSubtask[] = []

  constructor({file, ...props}: Partial<UploadTask> = {}) {
    // makeAutoObservable(this)
    makeObservable(this, {
      folderId: observable,
      file: observable,
      tasks: observable,
    })
    Object.assign(this, props)
    // 不能直接保存 file 对象
    if (file) {
      this.file = {size: file.size, name: file.name, type: file.type, path: file.path, lastModified: file.lastModified}
    }
  }

  // 使用 file.size 代替
  get size() {
    return this.file.size
  }

  get resolve() {
    return this.tasks.reduce((total, item) => total + (item.resolve ?? 0), 0)
  }

  get status() {
    // 上传状态
    if (this.tasks.some(item => item.status === TaskStatus.fail)) return TaskStatus.fail
    if (this.tasks.some(item => item.status === TaskStatus.pause)) return TaskStatus.pause
    if (this.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
    if (this.tasks.length && this.tasks.every(item => item.status === TaskStatus.finish)) return TaskStatus.finish
    return TaskStatus.ready
  }

  async beforeAddTask() {
    const filePath = this.file.path
    const stat = await fs.stat(filePath)
    const isFile = stat.isFile()
    const isDirectory = stat.isDirectory()

    if (isFile || isDirectory) {
      if (isFile) {
        beforeAddTask({size: stat.size})
      } else if (isDirectory) {
        const files = await fs.readdir(filePath)
        if (!files.length) {
          throw new Error('空文件夹')
        }
        for (const file of files) {
          const fullPath = path.resolve(filePath, file)
          const fstat = await fs.stat(fullPath)
          if (fstat.isFile()) {
            beforeAddTask({size: fstat.size})
          }
        }
      }
    } else {
      throw new Error(`格式不支持: ${this.file.name}`)
    }
  }

  async initTask() {
    if (this.tasks?.length) return

    const file = this.file
    const folderId = this.folderId

    if (file.size <= sizeToByte(config.maxSize)) {
      let supportName = file.name
      let type = file.type
      if (supportList.every(ext => !file.path.endsWith(`.${ext}`))) {
        supportName = createSpecificName(supportName)
        type = null
      }
      this.tasks = [
        {
          name: supportName,
          type: type,
          size: file.size,
          sourceFile: file,
          folderId: folderId,
          status: TaskStatus.ready,
          resolve: 0,
        },
      ]
    } else {
      let subFolderId = await findFolderByName(folderId, file.name).then(value => value?.fol_id)
      if (!subFolderId) {
        subFolderId = await mkdir({parentId: folderId, name: file.name})
      }
      const result = splitTask({file, splitSize: config.splitSize})
      this.tasks.push(
        ...result.splitFiles.map(value => ({
          name: value.name,
          size: value.size,
          type: null,
          sourceFile: value.sourceFile,
          status: TaskStatus.ready,
          folderId: subFolderId,
          resolve: 0,
          startByte: value.startByte,
          endByte: value.endByte,
        }))
      )
    }
  }

  getStream(subtask: UploadSubtask, taskIndex = 0) {
    const form = createUploadForm(subtask, taskIndex)
    const encoder = new FormDataEncoder(form)
    return {
      from: Readable.from(encoder),
      to: http.request.stream.post('html5up.php', {headers: encoder.headers}),
    }
  }

  async finishTask() {
    await delay(300)
  }
}

function createUploadForm(subTask: UploadSubtask, taskIndex: number) {
  const form = new FormData()
  const sourceFile = subTask.sourceFile
  const type = subTask.type || 'application/octet-stream'

  const fr = subTask.endByte
    ? fs.createReadStream(sourceFile.path, {start: subTask.startByte, end: subTask.endByte})
    : fs.createReadStream(sourceFile.path)

  form.append('task', 1)
  form.append('vie', 2)
  form.append('ve', 2)
  form.append('lastModifiedDate', new Date(sourceFile.lastModified))
  form.append('type', type)
  form.append('id', `WU_FILE_${taskIndex}`)
  form.append('folder_id_bb_n', subTask.folderId)
  form.append('size', subTask.size)
  form.append('name', subTask.name)
  form.append(
    'upload_file',
    {
      [Symbol.toStringTag]: 'File',
      size: subTask.size,
      name: subTask.name,
      type,
      stream() {
        return fr
      },
    },
    subTask.name
  )
  return form
}

function beforeAddTask(file: {size: number}) {
  if (file.size > sizeToByte(config.maxSize)) {
    throw new Error(`文件大小(${byteToSize(file.size)}) 超出限制，最大允许上传 ${config.maxSize}`)
  }
}
