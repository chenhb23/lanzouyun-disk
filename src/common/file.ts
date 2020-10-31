interface FileLs {
  all?: boolean // 查询全部，递归查询（速度较慢）
  // pageSize?: number // todo
}

/**
 * 列出文件夹下的所有文件 + 目录
 */
export async function ls(folderId = -1, {all} = {} as FileLs) {
  // 使用 request
}

interface FileRename {

}

/**
 * 重命名文件或文件夹
 */
export async function rename() {

}

/**
 * 删除文件或文件夹
 */
export async function rm(folderId) {

}
