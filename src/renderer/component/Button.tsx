import React from 'react'
import {Icon} from './Icon'
import './Button.css'

export type ButtonProps = {
  type?: 'primary' | 'danger' | 'default' | 'icon'

  // todo: 删除 icon
  icon?: IconName | React.ReactNode
  loading?: boolean
} & Omit<JSX.IntrinsicElements['button'], 'type'>

export const Button: React.FC<ButtonProps> = props => {
  const {type, className = '', icon, loading, ...rest} = props

  return (
    <button className={`Button ${type} ${className}`} {...rest}>
      {loading ? (
        <Icon iconName={'loading'} />
      ) : (
        icon && (typeof icon === 'string' ? <Icon iconName={icon as IconName} /> : icon)
      )}
      {rest.children}
    </button>
  )
}

Button.defaultProps = {
  type: 'default',
}
