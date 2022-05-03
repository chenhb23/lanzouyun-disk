import * as http from '../http'

interface MkdirOptions {
  parentId: FolderId // 父文件夹 id
  name: string // 文件名
  description?: string // 文件描述
  hideMessage?: boolean // 隐藏报错信息
}

export function mkdir(options: MkdirOptions) {
  const folder_name = options.name.replace(/[ ()]/g, '_')
  return http.request
    .post('doupload.php', {
      form: {task: 2, parent_id: options.parentId, folder_name, folder_description: options.description ?? ''} as Task2,
      ...(options.hideMessage ? {context: {hideMessage: options.hideMessage}} : {}),
    })
    .json<Task2Res>()
    .then(value => value.text)
}
