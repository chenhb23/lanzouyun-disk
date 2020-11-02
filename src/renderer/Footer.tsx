import React from "react";
import {observer} from "mobx-react";
import './Footer.css'
import {uploadManager} from "../common/manage/UploadManager";
import {downloadManager} from "../common/manage/DownloadManager";

const Footer = observer(() => {
  return (
    <div className='task'>
      <div className='upload'>
        {Object.keys(uploadManager.tasks).map(key => {
          const item = uploadManager.tasks[key]
          return (
            <p key={item.fileName}>{`${item.fileName}: ${item.resolve}`}</p>
          )
        })}
      </div>
      <div className='download'>
        {Object.keys(downloadManager.tasks).map(key => {
          const item = downloadManager.tasks[key]
          return (
            <p key={item.id}>{`${item.fileName}: ${item.resolve}`}</p>
          )
        })}
      </div>
    </div>
  )
})

export default Footer
