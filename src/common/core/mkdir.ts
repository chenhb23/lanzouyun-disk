import * as http from '../http'

export function mkdir(parentId: FolderId, folderName: string, folder_description = '') {
  folderName = folderName.replace(/[ ()]/g, '_')
  return http.request
    .post('doupload.php', {form: {task: 2, parent_id: parentId, folder_name: folderName, folder_description} as Task2})
    .json<Task2Res>()
    .then(value => value.text)
}
