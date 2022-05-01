import * as http from '../http'

// 移动文件
export function mv(file_id: FileId, folder_id: FolderId) {
  return http.request
    .post('doupload.php', {
      form: {task: 20, file_id, folder_id} as Task20,
    })
    .json<Task20Res>()
}
