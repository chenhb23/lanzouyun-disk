import React from "react";
import {observer} from "mobx-react";
import './Footer.css'
import {uploadManager} from "../common/manage/UploadManager";

const Footer = observer(() => {
  return (
    <div className='upload'>
      {Object.keys(uploadManager.tasks).map(key => {
        const item = uploadManager.tasks[key]
        return (
          <p key={item.fileName}>{`${item.fileName}: ${item.resolve}`}</p>
        )
      })}
    </div>
  )
})

export default Footer
