import * as http from '../http'

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
export function editFolderInfo(folder_id: FolderId) {
  return http.request
    .post('doupload.php', {
      form: {task: 18, folder_id} as Task18,
    })
    .json<Task18Res>()
}

// 文件夹信息
export function editFolder(folder_id: FolderId, folder_name: string, folder_description = '') {
  return http.request
    .post('doupload.php', {
      form: {task: 4, folder_id, folder_name, folder_description} as Task4,
    })
    .json<Task4Res>()
}
