import React, {useRef} from 'react'
import './Tabs.css'

export interface TabsProps {
  activeKey: string
}

export const Tabs: React.FC<TabsProps> = props => {
  const ref = useRef({[props.activeKey]: true})
  ref.current[props.activeKey] = true

  return (
    <div className='Tabs'>
      {React.Children.map(props.children, (child: any) => {
        const id = child.props?.id
        return ref.current[id] ? (
          <div key={id} className='TabsWrapper' style={id !== props.activeKey ? {display: 'none'} : {}}>
            {child}
          </div>
        ) : null
      })}
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
