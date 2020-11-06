import React from 'react'
import './Button.css'
import {Icon, IconName} from './Icon'

export type ButtonProps = {
  type?: 'primary' | 'default'
  icon?: IconName | React.ReactNode
  file?: boolean
  onChange?: (files: FileList) => void
  loading?: boolean
} & Omit<JSX.IntrinsicElements['button'], 'type'>

export const Button: React.FC<ButtonProps> = props => {
  const {type, className = '', icon, file, onChange, loading, ...rest} = props

  return (
    <button className={`Button ${type} ${className}`} {...rest}>
      {loading ? <Icon iconName={'loading'} /> : icon && (typeof icon === 'string' ? <Icon iconName={icon} /> : icon)}
      {file ? (
        <label className='ButtonLabel'>
          {rest.children}
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
        rest.children
      )}
    </button>
  )
}

Button.defaultProps = {
  type: 'default',
}
