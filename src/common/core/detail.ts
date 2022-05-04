import * as http from '../http'
import {LsFiles, URLType} from './ls'
import {asyncMap} from '../util'

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

export interface ShareData {
  name: string
  url: string
  pwd: string
}

// 每次两个请求
export async function share<T extends Pick<LsFiles, 'id' | 'type' | 'name'>>(files: T[]): Promise<ShareData[]> {
  const createFetch = (file: T) => {
    switch (file?.type) {
      case URLType.folder:
        return folderDetail(file.id)
      case URLType.file:
        return fileDetail(file.id)
      default:
        return null
    }
  }

  return asyncMap(files, async value => {
    const info = await createFetch(value)
    return {
      name: value.name,
      pwd: info.onof === '1' ? info.pwd : undefined,
      url: 'f_id' in info ? `${info.is_newd}/${info.f_id}` : info.new_url,
    }
  })
}
