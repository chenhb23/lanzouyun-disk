import request from '../request'

export function mkdir(parentId: FolderId, folderName: string, folder_description = '') {
  return request<Do2Res, Do2>({
    body: {task: 2, parent_id: parentId, folder_name: folderName, folder_description},
  }).then(({text, zt, info}) => {
    if (zt !== 1) {
      throw new Error(info)
    }
    return text
  })
}
