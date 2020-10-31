import request from "../request";

export function mkdir(parentId: FolderId, folderName: string) {
  return request<Do2Res, Do2>({
    body: {task: 2, parent_id: parentId, folder_name: folderName, folder_description: ''}
  }).then(value => value.text)
}
