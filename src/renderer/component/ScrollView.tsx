import React from 'react'
import './ScrollView.css'

export type ScrollViewProps = {
  HeaderComponent?: React.ReactNode
  FooterComponent?: React.ReactNode
} & JSX.IntrinsicElements['div']

// 外层需要 overflow: hidden
export const ScrollView: React.FC<ScrollViewProps> = ({HeaderComponent, FooterComponent, className = '', ...props}) => {
  return (
    <div className={`ScrollView ${className}`} {...props}>
      {HeaderComponent}
      <div className='ScrollViewContent'>{props.children}</div>
      {FooterComponent}
    </div>
  )
}
