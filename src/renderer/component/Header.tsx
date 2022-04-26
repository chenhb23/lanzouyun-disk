import React, {PropsWithChildren} from 'react'
import './Header.css'

export interface HeaderProps {
  right?: React.ReactNode
}

export const Header: React.FC<PropsWithChildren<HeaderProps>> = props => {
  return (
    <header className='header'>
      <div className='child'>{props.children}</div>
      {props.right && <div>{props.right}</div>}
    </header>
  )
}
