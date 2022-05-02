import React from 'react'

export interface MenuTitleProps extends Pick<React.LiHTMLAttributes<HTMLLIElement>, 'onClick' | 'title'> {}

export const MenuTitle: React.FC<MenuTitleProps> = props => {
  return (
    <li className='MenuTitle' title={props.title} onClick={props.onClick}>
      {props.children}
    </li>
  )
}
