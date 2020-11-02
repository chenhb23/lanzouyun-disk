import React, {FC, useState} from "react";
import './Dragarea.css'

export interface DragProps {
  onChange: (files: FileList) => void
}

export const Dragarea: FC<DragProps> = (props) => {
  const [text, setText] = useState('')

  return (
    <label
      className='dragarea'
      onDragOver={event => {
      event.preventDefault()
      event.stopPropagation()
    }}
      onDragEnter={event => {
        setText('放开上传')
        console.log('onDragEnter', event)
      }}
      onDragLeave={event => {
        setText('')
        console.log('onDragLeave', event)
      }}
      onDrop={event => {
        props.onChange(event.dataTransfer.files)
      }}
    >
      <input value='' style={{display: "none"}} type='file' onChange={event => {
        props.onChange(event.target.files)
      }} />
      {text || '拖到这里上传'}
    </label>
  )
}
