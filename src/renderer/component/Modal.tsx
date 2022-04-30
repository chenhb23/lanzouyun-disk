import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
import {useLatestRef} from '../hook/useLatestRef'
import './Modal.css'

export interface ModalProps {
  visible?: boolean
  animated?: boolean
  // mask?: boolean
  onCancel?: () => void
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
        document.body.appendChild(div)
        window.getComputedStyle(div).opacity // 必须要让浏览器计算div的css属性后，然后再设置div的style，才会触发transition动画
        div.classList.add('show')
        return () => {
          div.addEventListener('transitionend', () => !div.classList.contains('show') && div.remove(), {once: true})
          div.classList.remove('show')
        }
      } else {
        div.classList.add('show')
        document.body.appendChild(div)
        return () => {
          div.remove()
          div.classList.remove('show')
        }
      }
    }
  }, [div, props.animated, props.visible])

  const ref = useLatestRef(props.onCancel)

  useEffect(() => {
    const onKeyup = (ev: KeyboardEvent) => ev.key === 'Escape' && ref.current?.()

    if (props.visible) {
      window.addEventListener('keyup', onKeyup)
      return () => {
        window.removeEventListener('keyup', onKeyup)
      }
    }
  }, [ref, props.visible])

  return ReactDOM.createPortal(props.children, div)
}

Modal.defaultProps = {
  animated: true,
}
