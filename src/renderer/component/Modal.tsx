import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom'
import './Modal.css'

export interface ModalProps {
  visible?: boolean
  // mask?: boolean
}

export const Modal: React.FC<ModalProps> = props => {
  const [div] = useState(() => {
    const div = document.createElement('div')
    div.className = 'ModalMask'
    return div
  })

  useEffect(() => {
    if (props.visible) {
      document.body.append(div)
      return () => div.remove()
    }
  }, [props.visible])

  return ReactDOM.createPortal(props.children, div)
}
