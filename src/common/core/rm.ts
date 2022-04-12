import * as http from '../http'

/**
 * 删除文件或文件夹
 */
export function rm(id, isFile = true) {
  return isFile ? rmFile(id) : rmFolder(id)
}

export function rmFile(file_id: FileId) {
  return http.request.post('doupload.php', {form: {task: 6, file_id} as Task6}).json<Task6Res>()
}

export function rmFolder(folder_id: FolderId) {
  return http.request.post('doupload.php', {form: {task: 3, folder_id} as Task3}).json<Task3Res>()
}
