import * as http from '../http'

/**
 * 文件夹详情
 */
export function folderDetail(folder_id: FolderId) {
  return http.request
    .post('doupload.php', {form: {task: 18, folder_id} as Task18})
    .json<Task18Res>()
    .then(value => value.info)
}

/**
 * 文件详情
 */
export async function fileDetail(file_id: FileId) {
  return http.request
    .post('doupload.php', {form: {task: 22, file_id} as Task22})
    .json<Task22Res>()
    .then(value => value.info)
}
