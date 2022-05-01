import React from 'react'

export interface MenuTitleProps {
  onClick?: () => void
}

export const MenuTitle: React.FC<MenuTitleProps> = props => {
  return (
    <li className='MenuTitle' onClick={props.onClick} style={props.onClick ? {cursor: 'pointer'} : undefined}>
      {props.children}
    </li>
  )
}
