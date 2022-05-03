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
export function editFolder(folder_id: FolderId, folder_name: string, folder_description = '') {
  return http.request
    .post('doupload.php', {
      form: {task: 4, folder_id, folder_name, folder_description} as Task4,
    })
    .json<Task4Res>()
}

// 文件夹不能关闭密码
// 文件的密码不能为空
export function setAccess() {}
