import * as http from '../http'
import {LsFiles, URLType} from './ls'

export function editFileInfo(file_id: FileId) {
  return http.request
    .post('doupload.php', {
      form: {task: 46, type: 1, file_id} as Task46,
    })
    .json<Task46Res>()
}

export function editFile(file_id: FileId, file_name: string) {
  return http.request
    .post('doupload.php', {
      form: {task: 46, type: 2, file_id, file_name} as Task46,
    })
    .json<Task46Res>()
}

// 文件夹信息
export function editFolder(folder_id: FolderId, folder_name: string, folder_description = '') {
  return http.request
    .post('doupload.php', {
      form: {task: 4, folder_id, folder_name, folder_description} as Task4,
    })
    .json<Task4Res>()
}

export function setFileAccess(params: Omit<AccessData, 'type'>, hideMessage?: boolean) {
  return http.request
    .post('doupload.php', {
      form: {task: 23, file_id: params.id, shows: params.shows, shownames: params.shownames} as Task23,
      ...(hideMessage ? {context: {hideMessage}} : {}),
    })
    .json<Task23Res>()
}

export function setFolderAccess(params: Omit<AccessData, 'type'>, hideMessage?: boolean) {
  return http.request
    .post('doupload.php', {
      form: {task: 16, folder_id: params.id, shows: params.shows, shownames: params.shownames} as Task16,
      ...(hideMessage ? {context: {hideMessage}} : {}),
    })
    .json<Task16Res>()
}

export interface AccessData extends Pick<LsFiles, 'id' | 'type'>, Pick<Task23, 'shows' | 'shownames'> {}

// 文件夹不能关闭密码
// 文件的密码不能为空
export async function setAccess(data: AccessData[]) {
  let failTimes = 0 // 设置失败的数量
  for (const item of data) {
    try {
      switch (item.type) {
        case URLType.file:
          await setFileAccess(item, true)
          break
        case URLType.folder:
          await setFolderAccess(item, true)
          break
      }
    } catch (e) {
      failTimes++
    }
  }
  return failTimes
}
