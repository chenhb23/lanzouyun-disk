import React from "react";
import {observer} from "mobx-react";
import './Footer.css'
import {uploadManager} from "../common/manager/UploadManager";
import {downloadManager} from "../common/manager/DownloadManager";
import {byteToSize} from "../common/util";

const Footer = observer(() => {
  return (
    <div className='task'>
      <div className='upload'>
        {Object.keys(uploadManager.tasks).map(key => {
          const item = uploadManager.tasks[key]
          return (
            <p key={item.fileName}>{`${item.fileName}: ${byteToSize(item.resolve)}`}</p>
          )
        })}
      </div>
      <div className='download'>
        {Object.keys(downloadManager.tasks).map(key => {
          const item = downloadManager.tasks[key]
          return (
            <p key={item.id}>{`${item.fileName}: ${byteToSize(item.resolve)}`}</p>
          )
        })}
      </div>
    </div>
  )
})

export default Footer
