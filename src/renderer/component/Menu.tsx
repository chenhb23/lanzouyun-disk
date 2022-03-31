import React, {createContext, useContext, useEffect, useState} from 'react'
import './Menu.css'
import {Icon, IconName} from './Icon'

export const MenuContext = createContext({
  key: '',
  setKey: (key: string) => {},
})
MenuContext.displayName = 'MenuContext'

export interface MenuProps {
  title?: string
}

export const Menu: React.FC<MenuProps> = props => {
  return (
    <div>
      {props.title && <p className='MenuTitle'>{props.title}</p>}
      <ul className='Menu'>{props.children}</ul>
    </div>
  )
}

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
      <Icon iconName={props.icon} />
      {props.children}
    </li>
  )
}

interface MenuProviderProps {
  defaultKey: string
  onChange?: (key: string) => void
}

export const MenuProvider: React.FC<MenuProviderProps> = props => {
  const [key, setKey] = useState(() => props.defaultKey)
  useEffect(() => {
    props.onChange?.(key)
  }, [key])

  return <MenuContext.Provider value={{key, setKey}}>{props.children}</MenuContext.Provider>
}
