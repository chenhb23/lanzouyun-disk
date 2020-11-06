import request from '../request'

/**
 * 文件夹详情
 */
export function folderDetail(folder_id: FolderId) {
  return request<Do18Res, Do18>({
    body: {task: 18, folder_id},
  }).then(value => value.info)
}

/**
 * 文件详情
 */
export async function fileDetail(file_id: FileId) {
  return request<Do22Res, Do22>({
    body: {task: 22, file_id},
  }).then(value => value.info)
}
