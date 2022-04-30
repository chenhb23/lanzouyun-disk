import React, {createContext, PropsWithChildren, useCallback, useState} from 'react'
import './Menu.css'
import {MenuItem} from './MenuItem'
import {MenuTitle} from './MenuTitle'
import {useLatestRef} from '../../hook/useLatestRef'

export const MenuContext = createContext<{key: string; setKey: (key: string) => void}>(null)
MenuContext.displayName = 'MenuContext'

export interface MenuProps {
  activeKey?: string
  defaultKey?: string
  onChange?: (key: string) => void
  title?: string
}

export const Menu = (props: PropsWithChildren<MenuProps>) => {
  const [_key, _setKey] = useState(() => props.defaultKey)
  const key = props.activeKey ?? _key

  const onChange = useLatestRef(props.onChange)
  const setKey = useCallback(
    (nextKey: string) => {
      if (key !== nextKey) {
        _setKey(nextKey)
        onChange.current?.(nextKey)
      }
    },
    [key, onChange]
  )

  return (
    <ul className='Menu'>
      <MenuContext.Provider value={{key, setKey}}>{props.children}</MenuContext.Provider>
    </ul>
  )
}

Menu.Item = MenuItem
Menu.Title = MenuTitle
