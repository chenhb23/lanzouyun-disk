import React from 'react'
import './Button.css'
import {Icon} from './Icon'

export type ButtonProps = {
  type?: 'primary' | 'default' | 'icon'
  icon?: IconName | React.ReactNode
  file?: boolean
  onChange?: (files: FileList) => void
  loading?: boolean
} & Omit<JSX.IntrinsicElements['button'], 'type'>

export const Button: React.FC<ButtonProps> = props => {
  const {type, className = '', icon, file, onChange, loading, ...rest} = props

  return (
    <button className={`Button ${type} ${className}`} {...rest}>
      {loading ? (
        <Icon iconName={'loading'} />
      ) : (
        icon && (typeof icon === 'string' ? <Icon iconName={icon as IconName} /> : icon)
      )}
      {file ? (
        <label className='ButtonLabel'>
          {rest.children}
          <input
            value=''
            multiple
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
