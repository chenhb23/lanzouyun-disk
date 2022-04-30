import {lsDir} from './ls'

export async function isExist(folderId: FolderId) {
  if (folderId === -1) return true
  const {text, info} = await lsDir(folderId)
  return text.length + info.length > 0
}

export async function findFolderByName(parentId: FolderId, name: string) {
  const {text} = await lsDir(parentId)
  return text.find(item => item.name === name)
}
