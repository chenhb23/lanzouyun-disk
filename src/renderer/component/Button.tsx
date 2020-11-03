import React from 'react'
import './Button.css'
import {Icon, IconName} from './Icon'

export type ButtonProps = {
  type?: 'primary' | 'default' | 'icon'
  icon?: IconName | React.ReactNode
  file?: boolean
  onChange?: (files: FileList) => void
} & Omit<JSX.IntrinsicElements['button'], 'type'>

export const Button: React.FC<ButtonProps> = ({type, className = '', icon, file, onChange, ...props}) => {
  return (
    <button className={`Button ${type} ${className}`} {...props}>
      {icon && (typeof icon === 'string' ? <Icon iconName={icon} /> : icon)}
      {file ? (
        <label className='ButtonLabel'>
          {props.children}
          <input
            value=''
            style={{display: 'none'}}
            type='file'
            onChange={event => {
              onChange?.(event.target.files)
            }}
          />
        </label>
      ) : (
        props.children
      )}
    </button>
  )
}

Button.defaultProps = {
  type: 'default',
}
