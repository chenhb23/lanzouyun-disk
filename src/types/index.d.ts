type Bool = '0' | '1' // 是否需要访问密码，0：不需要，1：需要
type ZT =
  | 0 // 错误 {"zt": 0, "info": "错误7072", "text": null}
  | 1 // 成功（返回了 text）
  | 2 // 仅返回 info，无 text（或者空数组）
  | 9 // {"zt": 9, "info": "login not", "text": "error"}
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
// interface FolderEditInfo {
//   des: string // ''
//   is_newd: string // 'https://wwn.lanzouf.com'
//   name: string // 'wechat_devtools_1.05.2203070.dmg'
//   new_url: string // 'https://wwn.lanzouf.com/b01v9q6sh'
//   onof: string // '1'
//   pwd: string // '4pb8'
//   taoc: string // ''
// }
// 列表文件
interface FileInfo {
  filelock: string // '0'
  is_des: number // 0
  is_ico: number // 0
  is_lock: string // '0'
  downs: string // 下载次数
  id: FileId // 文件id
  icon: string // 'dmg'
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
  onof: Bool
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
interface Task47 {
  task: 47
  folder_id: FolderId
}

interface Task47Res {
  info: CrumbsInfo[] // 面包屑
  text: FolderInfo[] // 文件夹
  zt: ZT
}

///////////////////////////////////////////////////////////////////
// 文件列表请求体
interface Task5 {
  task: 5 // 列举目录下的文件
  folder_id: FolderId
  pg: number
}

interface Task5Res {
  info: 1
  text: FileInfo[]
  zt: ZT
}

///////////////////////////////////////////////////////////////////
// 文件详情请求体（分享id）
interface Task22 {
  task: 22
  file_id: FileId
}

interface Task22Res {
  info: FileDownloadInfo
  text: string | null
  zt: ZT
}

///////////////////////////////////////////////////////////////////
// 创建文件夹
interface Task2 {
  task: 2
  parent_id: FolderId // 2498513
  folder_name: string // 上传文件夹
  folder_description: string // 文件夹描述
}

interface Task2Res {
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
interface Task6 {
  task: 6
  file_id: FileId
}

interface Task6Res {
  info: string // '已删除'
  text: null
  zt: 1
}

///////////////////////////////////////////////////////////////////
// 删除文件夹
interface Task3 {
  task: 3
  folder_id: FolderId
}

interface Task3Res {
  info: string // "删除成功"
  text: null
  zt: 1
}

///////////////////////////////////////////////////////////////////
// 文件夹信息
interface Task18 {
  task: 18
  folder_id: FolderId
}
interface Task18Res {
  info: FolderShareInfo
  text: null
  zt: 1
}
///////////////////////////////////////////////////////////////////
// // 文件夹信息
// interface Task18 {
//   task: 18
//   folder_id: FolderId
// }
// interface Task18Res {
//   info: FolderEditInfo
//   text: null
//   zt: 1
// }

// 重名文件夹 | 修改资料(话说)
interface Task4 {
  task: 4
  folder_id: FolderId
  folder_name: string
  folder_description: string
}
interface Task4Res {
  info: string // "修改成功"
  text: null
  zt: ZT // 1
}
///////////////////////////////////////////////////////////////////
type Task46 =
  // 重命名文件 - 查询文件信息
  | {
      task: 46
      type: 1 // 1 查询信息
      file_id: FileId
    }
  // 重命名文件 - 修改文件信息
  | {
      task: 46
      type: 2 // 2 修改信息
      file_id: FileId
      file_name: string // IMG_88A7CB7A49-1.jpeg.lzy
    }
interface Task46Res {
  info: string // "IMG_885BA7CB7A49-1.jpeg.lzy"
  text: null
  zt: ZT
}
///////////////////////////////////////////////////////////////////
interface Task20 {
  task: 20
  folder_id: FolderId // 5276093
  file_id: FileId // 67855328
}
interface Task20Res {
  info: string // "移动成功"
  text: null
  zt: ZT
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
  id: string // 文件id，如果带有 ?webpage=xxxx 的查询参数，代表是密码文件
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
