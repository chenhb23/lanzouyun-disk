import React, {useContext} from 'react'
import {Icon} from '../Icon'
import {MenuContext} from './Menu'

export interface MenuItemProps {
  id: string
  icon?: IconName
  active?: boolean
  onClick?: () => void
}

export const MenuItem: React.FC<MenuItemProps> = props => {
  const context = useContext(MenuContext)
  return (
    <li
      className={`MenuItem ${context.key === props.id ? 'active' : ''}`}
      onClick={() => {
        context.setKey(props.id)
        props.onClick?.()
      }}
    >
      {!!props.icon && <Icon iconName={props.icon} />}
      {props.children}
    </li>
  )
}
