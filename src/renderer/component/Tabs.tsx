import React from 'react'
import './Tabs.css'

export interface TabsProps {
  activeKey: string
}

export const Tabs: React.FC<TabsProps> = props => {
  return (
    <div className='Tabs'>
      {(props.children as any).map(child => (
        <div
          key={child.props.id}
          className='TabsWrapper'
          style={child.props.id !== props.activeKey ? {display: 'none'} : {}}
        >
          {child.props.panetop}
          {child}
        </div>
      ))}
    </div>
  )
}

export type TabPaneProps = {
  id: string
  panetop?: React.ReactNode
} & JSX.IntrinsicElements['div']

export const TabPane: React.FC<TabPaneProps> = ({className, ...props}) => {
  return (
    <div className={`TabPane ${className}`} {...props}>
      {props.children}
    </div>
  )
}
