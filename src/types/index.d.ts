type Bool = '0' | '1' // 是否需要访问密码
type ZT =
  | 0
  | 1 // 成功
  | 9 // login not
type FileId = string | number
type FolderId = string | number

///////////////////////////////////////////////////////////////////
// 面包屑文件夹
interface CrumbsInfo {
  folder_des: string
  folderid: FolderId
  name: string
  now: 0 | 1
}

// 目录下的文件夹
interface FolderInfo {
  fol_id: FolderId
  folder_des: string
  folderlock: Bool
  is_lock: Bool
  name: string
  onof: Bool // 是否需要访问密码
}

// 列表文件
interface FileInfo {
  filelock: '0'
  is_des: 0
  is_ico: 0
  is_lock: '0'
  downs: string // 下载次数
  id: FileId // 文件id
  icon: 'dmg'
  name: string // 文件名, 省略
  name_all: string // 文件名, 全部
  onof: Bool
  size: string // 文件大小
  time: string // 修改时间
}

// 分享信息
interface FileDownloadInfo {
  f_id: string // 文件url id（和 is_newd 拼起来）
  is_newd: string // 文件域名
  onof: Bool // 是否需要访问密码
  pwd: string // 提取密码
  taoc: string
}

// 文件上传的返回结果
interface FileUploadRes {
  f_id: string
  is_newd: string // 域名
  downs: string
  icon: string
  id: string
  name: string
  name_all: string
  onof: string
  size: string
  time: string
}
interface FolderShareInfo {
  des: string // ''
  is_newd: string // 'https://wws.lanzous.com'
  name: string // 'e8fa618362844fec927d67ed7ea27db7.png'
  new_url: string // 'https://wws.lanzous.com/b01tp16xg'
  onof: Bool // '1'
  pwd: string // '5wex'
  taoc: string // ''
}
///////////////////////////////////////////////////////////////////
// 列举文件夹
interface Do47 {
  task: 47
  folder_id: FolderId
}

interface Do47Res {
  info: CrumbsInfo[]
  text: FolderInfo[]
  zt: ZT
}

///////////////////////////////////////////////////////////////////
// 文件列表请求体
interface Do5 {
  task: 5 // 列举目录下的文件
  folder_id: FolderId
  pg: number
}

interface Do5Res {
  info: 1
  text: FileInfo[]
  zt: ZT
}

///////////////////////////////////////////////////////////////////
// 文件详情请求体（分享id）
interface Do22 {
  task: 22
  file_id: FileId
}

interface Do22Res {
  info: FileDownloadInfo
  text: string | null
  zt: ZT
}

///////////////////////////////////////////////////////////////////
// 创建文件夹
interface Do2 {
  task: 2
  parent_id: FolderId // 2498513
  folder_name: string // 上传文件夹
  folder_description: string // 文件夹描述
}

interface Do2Res {
  info: string // "创建成功"
  text: FolderId // "2514952"
  zt: 1
}

///////////////////////////////////////////////////////////////////
// 文件上传
interface Do1Res {
  info: string
  text: FileUploadRes[] | null
  zt:
    | 0 // 无法识别文件内容，请联系客服处理
    | 1 // 成功
}

///////////////////////////////////////////////////////////////////
// 删除文件
interface Do6 {
  task: 6
  file_id: FileId
}

interface Do6Res {
  info: string // '已删除'
  text: null
  zt: 1
}

///////////////////////////////////////////////////////////////////
// 删除文件夹
interface Do3 {
  task: 3
  folder_id: FolderId
}

interface Do3Res {
  info: string // "删除成功"
  text: null
  zt: 1
}

///////////////////////////////////////////////////////////////////
interface Do18 {
  task: 18
  folder_id: FolderId
}
interface Do18Res {
  info: FolderShareInfo
  text: null
  zt: 1
}
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
interface ShareFileReq {
  lx: 2
  fid: 2521232
  uid: 1702063
  pg: 1
  rep: 0
  t: string // ibezwz
  k: string // ihdbys
  up: 1
  ls: 1
  pwd: string
}

interface ShareFile {
  duan: string // "ihyz5a"
  icon: string // "zip"
  id: string // "iNHbWhyz5ab"
  name_all: string // "cn_windows_10_business_editions_version_1803_updated_march_2018_x64_dvd_12063730.iso.009.lzy.zip"
  p_ico: number // 0
  size: string // '69.0 M'
  t: number // 0
  time: string // '昨天11:13'
}
interface ShareFileRes {
  info: 'success'
  text: ShareFile[]
  zt: 1
}

// 文件，带密码
interface DownloadUrlRes {
  dom: string // 域名
  inf: string // 文件名
  url: string // file/ 的后缀
  zt: number
}

interface LZRequest<I = any, T = any> {
  info: I
  text: T
  zt: number
}
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
