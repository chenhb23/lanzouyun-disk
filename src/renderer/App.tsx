import React, {useEffect, useState} from "react";
import './App.css';
import requireModule from "../common/requireModule";
import request from "../common/request";

const FD = requireModule('form-data')

function App() {
  useEffect(function () {

  }, [])

  function mergeFile() {
    const fd = new FD()
    fd.append('task', 47)
    fd.append('folder_id', 2513482)

    request({
      // method: 'get',idu.com',
      path: '/doupload.php',
      body: fd,
    }).then(value => {
      console.log(value)
    })
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
            <li>根目录</li>
            <li>根目录</li>
            <li>根目录</li>
          </ul>
        </div>
        <div className='content'>
          <button onClick={mergeFile}>test</button>
        </div>
      </div>
    </div>
  );
}

export default App;
