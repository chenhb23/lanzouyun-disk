import request from '../request'

/**
 * 删除文件或文件夹
 */
export async function rm(id, isFile = true) {
  if (isFile) {
    return rmFile(id)
  } else {
    return rmFolder(id)
  }
}

export async function rmFile(file_id: FileId) {
  return request<Do6Res, Do6>({
    body: {task: 6, file_id},
  })
}

export async function rmFolder(folder_id: FolderId) {
  return request<Do3Res, Do3>({
    body: {task: 3, folder_id},
  })
}
