import React, {useEffect, useMemo, useState} from "react";
import './App.css';
// import request, {baseHeaders} from "../common/request";
import requireModule from "../common/requireModule";
import {ls} from "../common/file/ls";
import {parseDownloadUrl} from "../common/file/download";
import upload from "../common/file/upload";

// const Cheerio = requireModule('cheerio')
const FD = requireModule('form-data')
const fs = requireModule('fs')
const querystring = requireModule('querystring')
const electron = requireModule('electron')

function App() {
  const [list, setList] = useState({} as AsyncReturnType<typeof ls>)
  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  useEffect(function () {
    listFile(-1)
  }, [])

  function listFile(folder_id) {
    ls(folder_id).then(value => setList(value))
  }

  function test() {
    console.log('test')
    electron.ipcRenderer.send('download', 'download url', 'aaaa')
    console.log('test2')
  }

  function download(fileId: FileId) {
    parseDownloadUrl(fileId).then(value => {
      console.log('download url', value)
      electron.ipcRenderer.send('download', value)
    })
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
          <li onClick={test}>test</li>
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
                uploadFile(event.target.files[0].path)
              }}/>
            </li>
          </ul>
        </div>
        <div className='content'>
          <ul>
            {list.text?.map((item, i) => {
              return 'fol_id' in item ? (
                <li key={i} onClick={() => listFile(item.fol_id)}>{item.name + '（文件夹）'}</li>
              ) : (
                <li key={i} title={item.name_all}>
                  {`${item.name} / ${item.size} / ${item.time}`}
                  <span onClick={() => download(item.id)}>'（下载）'</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
