import request from '../request'

interface LsOptions {
  all?: boolean // 查询全部，递归查询（速度较慢）
  // pageSize?: number // todo
}

/**
 * 列出文件夹下的所有文件 + 目录
 */
export async function ls(folder_id = -1, {all = true} = {} as LsOptions) {
  const [res1, res2] = await Promise.all([lsDir(folder_id), lsFile(folder_id)])

  return {
    ...res1,
    text: [...res1.text, ...res2],
  }
}

/**
 * 列出文件夹下所有文件
 */
export async function lsFile(folder_id: FolderId) {
  let pg = 1,
    len = 0
  const fileList: Do5Res['text'] = []
  do {
    const {text} = await request<Do5Res, Do5>({
      body: {task: 5, folder_id, pg: pg++},
    })
    len = text.length
    fileList.push(...text)
  } while (len)

  return fileList
}

/**
 * 列出该文件夹下的id
 * @param folder_id
 */
export async function lsDir(folder_id) {
  return request<Do47Res, Do47>({
    body: {task: 47, folder_id},
  })
}
