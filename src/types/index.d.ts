type Bool = "0" | "1"
type ZT =
  | 0
  | 1 // 成功
  | 9 // login not

///////////////////////////////////////////////////////////////////

// 目录列表请求体
interface DouploadFolderList {
    task: "47" // 列举目录
    folder_id: number
}

interface DouploadFolderListRes {
    // 面包屑文件夹
    info: {
        folder_des: string
        folderid: number
        name: string
        now: 0 | 1
    }[]
    // 目录下的文件夹
    text: {
        fol_id: string
        folder_des: string
        folderlock: Bool
        is_lock: Bool
        name: string
        onof: Bool // 是否需要访问密码
    }[]
    zt: ZT
}
///////////////////////////////////////////////////////////////////
// 文件列表请求体
interface DouploadFolderFileList {
    task: "5" // 列举目录下的文件
    folder_id: number
    pg: number
}

interface DouploadFolderFileListRes {
    info: 1
    text: {
        downs: string // 下载次数
        filelock: "0"
        icon: "dmg"
        id: string // 文件id
        is_des: 0
        is_ico: 0
        is_lock: "0"
        name: string // 文件名, 省略
        name_all: string // 文件名, 全部
        onof: Bool
        size: string // 文件大小
        time: string // 修改时间
    }[]
    zt: ZT
}
///////////////////////////////////////////////////////////////////

// 文件详情请求体
interface DouploadFileDetail {
    task: "22" // 列举目录下的文件
    file_id: string
}

interface DouploadFileDetailRes {
    info: {
        f_id: string // 文件url id（和 is_newd 拼起来）
        is_newd: string // 文件域名
        onof: Bool // 是否需要访问密码
        pwd: string // 提取密码
        taoc: string
    }
    text: string | null
    zt: ZT
}
///////////////////////////////////////////////////////////////////












///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
interface Base {
    info: string
    text: string
    zt: ZT
}
