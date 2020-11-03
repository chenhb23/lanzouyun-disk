import React from 'react'
import './Header.css'

export interface HeaderProps {
  right?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = props => {
  return (
    <header className='header'>
      <div>{props.children}</div>
      {props.right && <div>{props.right}</div>}
    </header>
  )
}
