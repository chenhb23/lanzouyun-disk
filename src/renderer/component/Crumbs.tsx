import React from 'react'
import './Crumbs.css'
import {Icon} from './Icon'

export interface CrumbsProps {
  crumbs: Pick<CrumbsInfo, 'name' | 'folderid'>[]
  onClick?: (folderid) => void
}

export const Crumbs: React.FC<CrumbsProps> = props => {
  return (
    <ul className='crumbs'>
      {/*<li onClick={() => props.onClick(-1)}>全部文件</li>*/}
      {props.crumbs?.map(item => (
        <li key={item.folderid} onClick={() => props.onClick?.(item.folderid)}>
          <Icon iconName='right' />
          {item.name}
        </li>
      ))}
    </ul>
  )
}
