import request from "../request";

interface LsOptions {
  all?: boolean // 查询全部，递归查询（速度较慢）
  // pageSize?: number // todo
}

/**
 * 列出文件夹下的所有文件 + 目录
 */
export async function ls(folder_id = -1, {all = true} = {} as LsOptions) {
  let pg = 1
  const [res1, res2] = await Promise.all([
    request<Do47Res, Do47>({
      body: {task: 47, folder_id}
    }),
    request<Do5Res, Do5>({
      body: {task: 5, folder_id, pg}
    })
  ])

  let fileList = []
  if ((fileList = res2.text)?.length) {
    while (fileList?.length) {
      const res = await request<Do5Res, Do5>({
        body: {task: 5, folder_id, pg: ++pg}
      })
      fileList = res.text
      res2.text.push(...fileList)
    }
  }
  // res1.text.push(...res2.text)
  // return [...res1.text, ...res2.text]
  return {
    ...res1,
    text: [
      ...res1.text,
      ...res2.text
    ]
  }
}
