import React, {useEffect, useMemo, useReducer, useState} from "react";
import './App.css';
import {autorun, computed, makeAutoObservable, observable, remove, obser} from 'mobx'
// import request, {baseHeaders} from "../common/request";
import requireModule from "../main/requireModule";
import {ls, lsFile} from "../common/file/ls";
import {parseDownloadUrl} from "../common/file/download";
import upload from "../common/file/upload";
import config from '../main/project.config'
import {isSpecificFile, mkTempDirSync} from "../common/util";
import {observer} from "mobx-react";
import {uploadManager} from "../common/manage/UploadManager";

const FD = requireModule('form-data')
const fs = requireModule('fs')
const path = requireModule('path')
const querystring = requireModule('querystring')
const electron = requireModule('electron')

class Timer {
  constructor() {
    makeAutoObservable(this)
  }

  task: {[key: string]: any} = {
    a: {
      id: 'aa',
      subTasks: [
        {id: '1', taskName: '1', status: 'pause'},
        {id: '2', taskName: '2', status: 'pause'},
        {id: '3', taskName: '3', status: 'pause'},
      ]
    },
    b: {
      id: 'bb',
      subTasks: [
        {id: '1', taskName: '1', status: 'pause'},
        {id: '2', taskName: '2', status: 'pause'},
        {id: '3', taskName: '3', status: 'pause'},
      ]
    }
  }
}

const timer = new Timer()

const Todo1 = observer(() => (
  <div>
    <div onClick={() => {
      remove(timer.task, 'b')
      // const {a, ...left} = timer.task
      //
      // timer.task = left
    }}>handle</div>
    {Object.keys(timer.task).map(item => timer.task[item].subTasks).flat().map(item => (
      <div key={item.id}>{item.status}</div>
    ))}
  </div>
))

const Todo2 = observer(() => {
  console.log(uploadManager.tasks)

  return (
    <div>
      <p>{uploadManager.queue}</p>
      {Object.keys(uploadManager.tasks).map(filePath => (
        <p key={filePath}>{filePath}</p>
      ))}

    </div>
  )
})


function Father() {
  return (
    <div>
      <Todo1/>
      <Todo2/>
    </div>
  )
}

type List = AsyncReturnType<typeof ls>
const delay = (time = 500) => new Promise(resolve => setTimeout(resolve, time))

function App() {
  const [list, setList] = useState({} as List)
  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  useEffect(function () {
    listFile(-1)
    // console.log(isFile('软件'))
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
    if (files.length) {
      // 创建临时文件夹
      const tempDir = mkTempDirSync()
      console.log('tempDir:', tempDir)
      // 全部下载到临时文件夹
      for (const file of files) {
        await download(file.id, tempDir)
        await delay(500)
      }
      // files.forEach(file => {
      //
      // })
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

  function isFile(name: string) {
    return /\.[0-9a-zA-Z]+$/.test(name)
  }

  return (
    <div className="App">
      <div className='side'>
        <ul>
          <li>文件</li>
          <li>个人中心</li>
          <li>回收站</li>
          <Father />
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
                uploadManager.addTask({
                  fileName: file.name,
                  filePath: file.path,
                  folderId: currentFolder,
                  size: file.size,
                })
                // console.log(event.target.files[0].path)
                // console.log(path.basename(event.target.files[0].path))
              }}/>
            </li>
          </ul>
        </div>
        <div className='content'>
          <ul>
            {list.text?.map((item, i) => {
              return 'fol_id' in item ? (
                <li key={i} onClick={() => listFile(item.fol_id)}>
                  {item.name + '（文件夹）'}
                  {isFile(item.name) && <span onClick={() => downloadFolder(item)}>（下载）</span>}
                </li>
              ) : (
                <li key={i} title={item.name_all}>
                  {`${item.name} / ${item.size} / ${item.time}`}
                  <span onClick={() => download(item.id)}>（下载）</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App;

