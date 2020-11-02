import React, {useEffect, useMemo, useState} from "react";
import './App.css';
import {ls} from "../common/file/ls";
import {isFile} from "../common/util";
import {uploadManager} from "../common/manage/UploadManager";
import Footer from "./Footer";
import {downloadManager} from "../common/manage/DownloadManager";

type List = AsyncReturnType<typeof ls>

function App() {
  const [list, setList] = useState({} as List)
  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  useEffect(function () {
    listFile(-1)
  }, [])

  function listFile(folder_id) {
    ls(folder_id).then(value => setList(value))
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
            <li>
              <input type='file' value={''} onChange={event => {
                const file = event.target.files[0]
                console.log('file', file)
                uploadManager.addTask({
                  fileName: file.name,
                  filePath: file.path,
                  folderId: currentFolder,
                  size: file.size,
                  type: file.type,
                })
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
                  <span onClick={() => downloadManager.addTask({
                    id: item.id,
                    name_all: item.name_all,
                  })}>（下载）</span>
                </li>
              )
            })}
          </ul>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default App;

