import * as http from '../http'
import {ls, lsDir, LsFiles, URLType} from './ls'
import {mkdir} from './mkdir'
import {rmFolder} from './rm'

// 移动文件
export function mvFile(folder_id: FolderId, file_id: FileId) {
  return http.request
    .post('doupload.php', {
      form: {task: 20, file_id, folder_id} as Task20,
    })
    .json<Task20Res>()
}

type MoveFiles = Pick<LsFiles, 'name' | 'type' | 'id'>

class FileTree implements MoveFiles {
  id: string
  name: string
  type: URLType
  children?: FileTree[]

  // 目录移动后保存目录, 默认 false
  keep?: boolean

  // 是否保存目录，如果子类保存，则父类也保存
  get isKeep() {
    return this.keep || this.children?.some(value => value.isKeep)
  }

  constructor(data = {} as MoveFiles) {
    Object.assign(this, data)
  }
}

// 深度优先递归删除目录
async function deleteMovedFolder(tree: FileTree[] = []) {
  for (const item of tree) {
    if (item.type === URLType.folder) {
      if (item.children?.length) {
        await deleteMovedFolder(item.children)
      }
      if (!item.isKeep) {
        // 删除文件夹
        await rmFolder(item.id)
      }
    }
  }
}

/**
 * 生成文件树
 * todo: 增加查询间隔
 */
export function fileTree(files: MoveFiles[] = [], level = 0): Promise<FileTree[]> {
  return Promise.all(
    files.map(async file => {
      const item = new FileTree(file)
      if (item.type === URLType.folder) {
        const nextLevel = level + 1
        if (nextLevel > 4) {
          throw new Error(`${item.name} 移动后超过4层，操作已取消！`)
        }
        const next = await ls(item.id)
        item.children = await fileTree(next.text, nextLevel)
      }
      return item
    })
  )
}

// 如果 folderId 目录下不存在 name 的文件夹，则新建一个文件并返回文件夹 id
function foldersWithCache() {
  const cache: {[folderId: string]: FolderInfo[]} = {}
  return async function ensureFolder(folderId: FolderId, name: string) {
    folderId = `${folderId}`
    let folders = cache[folderId]
    if (!folders) {
      const {text} = await lsDir(folderId)
      folders = cache[folderId] = text
    }
    let nextFolderId = folders?.find(value => value.name === name)?.fol_id
    if (!nextFolderId) {
      // 空文件夹也会移动过去
      nextFolderId = await mkdir({parentId: folderId, name, hideMessage: true})
      // 删除缓存，以便重新查询新文件目录
      delete cache[folderId]
    }
    return nextFolderId
  }
}

// 计算文件树数量
export function countTree(tree: FileTree[], count = [0, 0]) {
  tree.forEach(value => {
    if (value.type === URLType.file) {
      count[0]++
    } else if (value.type === URLType.folder) {
      count[1]++
    }
    if (value.children?.length) {
      countTree(value.children, count)
    }
  })
  return count
}

/**
 * 移动文件和文件夹
 * 可用 mv 代替 mvFile
 */
export async function mv(files: MoveFiles[], target: FolderId, level: number) {
  const tree = await fileTree(files, level)

  const ensureFolder = foldersWithCache()

  await (async function doMove(items: FileTree[] = [], folderId: FolderId, movedIds = new Set<string>()) {
    movedIds.add(`${folderId}`)
    for (const item of items) {
      switch (item.type) {
        case URLType.file: {
          await mvFile(folderId, item.id)
          break
        }
        case URLType.folder: {
          const nextFolderId = await ensureFolder(folderId, item.name)
          await doMove(item.children, nextFolderId, movedIds)
          if (movedIds.has(`${item.id}`)) {
            item.keep = true
          }
          break
        }
      }
    }
  })(tree, target)

  // 删除移动后的目录
  await deleteMovedFolder(tree)

  return tree
}
