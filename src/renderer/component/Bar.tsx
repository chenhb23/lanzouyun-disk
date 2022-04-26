import React, {PropsWithChildren} from 'react'
import './Bar.css'

export interface BarProps {
  // crumbs: CrumbsInfo[]
  // onClick: (folderid) => void
}

export const Bar: React.FC<PropsWithChildren<BarProps>> = props => {
  return (
    <div className='bar'>
      {props.children}
      {/*<ul className='crumbs'>*/}
      {/*  <li onClick={() => props.onClick(-1)}>全部文件</li>*/}
      {/*  {props.crumbs.map(item => (*/}
      {/*    <li key={item.folderid} onClick={() => props.onClick(item.folderid)}>*/}
      {/*      <Icon iconName='right' />*/}
      {/*      {item.name}*/}
      {/*    </li>*/}
      {/*  ))}*/}
      {/*</ul>*/}
    </div>
  )
}

Bar.defaultProps = {
  // crumbs: [],
}
