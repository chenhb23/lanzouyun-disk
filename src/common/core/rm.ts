import request from '../request'

/**
 * 删除文件或文件夹
 */
export function rm(id, isFile = true) {
  return isFile ? rmFile(id) : rmFolder(id)
}

export function rmFile(file_id: FileId) {
  return request<Do6Res, Do6>({body: {task: 6, file_id}})
}

export function rmFolder(folder_id: FolderId) {
  return request<Do3Res, Do3>({body: {task: 3, folder_id}})
}
