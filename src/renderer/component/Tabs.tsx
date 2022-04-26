import React, {PropsWithChildren} from 'react'
import './Tabs.css'

export interface TabsProps {
  activeKey: string
}

export const Tabs: React.FC<PropsWithChildren<TabsProps>> = props => {
  return (
    <div className='Tabs'>
      {(props.children as any).map(child => (
        <div
          key={child.props.id}
          className='TabsWrapper'
          style={child.props.id !== props.activeKey ? {display: 'none'} : {}}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export type TabPaneProps = {
  id: string
} & JSX.IntrinsicElements['div']

export const TabPane: React.FC<TabPaneProps> = props => {
  return <>{props.children}</>
  // return (
  //   <div className={`TabPane ${className}`} {...props}>
  //     {props.children}
  //   </div>
  // )
}
