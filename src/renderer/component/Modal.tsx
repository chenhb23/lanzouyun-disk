import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
import './Modal.css'
import {delay} from '../../common/util'

export interface ModalProps {
  visible?: boolean
  animated?: boolean
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
      if (props.animated) {
        document.body.append(div)
        delay(100).then(() => div.classList.add('show'))
        return () => {
          div.classList.remove('show')
          delay(300).then(() => div.remove())
        }
      } else {
        div.classList.add('show')
        document.body.append(div)
        return () => div.remove()
      }
    }
  }, [props.visible])

  return ReactDOM.createPortal(props.children, div)
}

Modal.defaultProps = {
  animated: true,
}
