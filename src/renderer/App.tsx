import React, {useEffect, useMemo, useState} from "react";
import './App.css';
import requireModule from "../main/requireModule";
import {ls, lsFile} from "../common/file/ls";
import {parseDownloadUrl} from "../common/file/download";
import upload from "../common/file/upload";
import {isFile, mkTempDirSync} from "../common/util";
import {uploadManager} from "../common/manage/UploadManager";
import Footer from "./Footer";
import {downloadManager} from "../common/manage/DownloadManager";

const electron = requireModule('electron')

type List = AsyncReturnType<typeof ls>
const delay = (time = 500) => new Promise(resolve => setTimeout(resolve, time))

function App() {
  const [list, setList] = useState({} as List)
  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  useEffect(function () {
    listFile(-1)
    // console.log(isFile('软件'))
    // console.log("restoreFileName('V 拷贝 4@2x.png.lzy.zip')", restoreFileName('V 拷贝 4@2x.png.lzy.zip'))
  }, [])

  function listFile(folder_id) {
    ls(folder_id).then(value => setList(value))
  }

  function test() {
    console.log('test')
    electron.ipcRenderer.send('download', 'download url', 'aaaa')
    console.log('test2')
  }

  function download(fileId: FileId, folderPath?: string) {
    return parseDownloadUrl(fileId).then(downloadUrl => {
      console.log('download url', downloadUrl)
      electron.ipcRenderer.send('download', downloadUrl, folderPath)
    })
  }

  async function downloadFolder(folder: FolderInfo) {
    const files = await lsFile(folder.fol_id)
    // 去重
    if (files.length) {
      // 创建临时文件夹
      const tempDir = mkTempDirSync()
      console.log('tempDir:', tempDir)
      // 全部下载到临时文件夹
      for (const file of files) {
        await download(file.id, tempDir)
        await delay(500)
      }
      // 合并所有文件到目标文件夹
    }
  }

  async function uploadFile(filePath) {
    await upload({
      folderId: currentFolder,
      filePath: filePath,
    })
    console.log('上传成功！')
  }

  return (
    <div className="App">
      <div className='side'>
        <ul>
          <li>文件</li>
          <li>个人中心</li>
          <li>回收站</li>
        </ul>
      </div>
      <div className='main'>
        <div className='header'>
          <ul className='crumbs'>
            <li onClick={() => listFile(-1)}>根目录</li>
            {list.info?.map(item => (
              <li key={item.folderid} onClick={() => listFile(item.folderid)}>{item.name}</li>
            ))}
          </ul>

          <ul className='functions'>
            <li>新建文件夹：todo</li>
            {/*<li onClick={() => upload({
              folderId: currentFolder,
              filePath: '/Users/chb/Downloads/Geekbench_5_5.2.5.dmg'
            })}>上传 {currentFolder}</li>*/}
            <li>
              <input type='file' onChange={event => {
                const file = event.target.files[0]
                console.log('file', file)
                uploadManager.addTask({
                  fileName: file.name,
                  filePath: file.path,
                  folderId: currentFolder,
                  size: file.size,
                  type: file.type,
                })
                // console.log(event.target.files[0].path)
                // console.log(path.basename(event.target.files[0].path))
              }}/>
            </li>
          </ul>
        </div>
        <div className='content'>
          <ul className='files'>
            {list.text?.map((item, i) => {
              return 'fol_id' in item ? (
                <li key={i}>
                  <span onClick={() => listFile(item.fol_id)}>{item.name + '（文件夹）'}</span>
                  {isFile(item.name) && <span onClick={() => downloadManager.addTask({
                    fol_id: item.fol_id,
                    name: item.name,
                  })}>（下载）</span>}
                </li>
              ) : (
                <li key={i} title={item.name_all}>
                  {`${item.name} / ${item.size} / ${item.time}`}
                  {/*<span onClick={() => download(item.id)}>（下载）</span>*/}
                  <span onClick={() => downloadManager.addTask({
                    id: item.id,
                    name_all: item.name_all,
                  })}>（下载）</span>
                </li>
              )
            })}
          </ul>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default App;

