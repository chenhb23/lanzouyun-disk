import React, {CSSProperties, useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
import {useLatestRef} from '../hook/useLatestRef'
import './Modal.css'
import {Button, ButtonProps} from './Button'

export interface ModalProps {
  width?: string | number
  visible?: boolean
  animated?: boolean
  // mask?: boolean
  title?: React.ReactNode

  cancelText?: React.ReactNode
  onCancel?: () => void

  okText?: React.ReactNode
  onOk?: () => void
  okButtonProps?: ButtonProps

  bodyStyle?: CSSProperties

  footer?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = props => {
  const [div] = useState(() => {
    const div = document.createElement('div')
    div.classList.add('ModalRoot')
    return div
  })

  useEffect(() => {
    if (props.visible) {
      if (props.animated) {
        document.body.appendChild(div)
        window.getComputedStyle(div).opacity // 必须要让浏览器计算div的css属性后，然后再设置div的style，才会触发transition动画
        div.classList.add('show')
        return () => {
          // ev.propertyName === 'background-color'
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

  return ReactDOM.createPortal(
    <>
      <div className='ModalMask' onClick={props.onCancel} />
      <div className='Modal' style={props.width ? {width: props.width} : undefined}>
        {!!props.title && <div className='ModalHeader'>{props.title}</div>}
        <div className='ModalBody' style={props.bodyStyle}>
          {props.children}
        </div>
        {props.footer === null ? null : (
          <div className='ModalFooter'>
            {React.isValidElement(props.footer) ? (
              props.footer
            ) : (
              <>
                <Button onClick={props.onCancel}>{props.cancelText ?? '取消'}</Button>
                <Button type={'primary'} {...props.okButtonProps} onClick={props.onOk}>
                  {props.okText ?? '确认'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </>,
    div
  )
}

Modal.defaultProps = {
  animated: true,
}
