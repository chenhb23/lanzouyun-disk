import React, {CSSProperties} from 'react'
import './Bar.css'

export interface BarProps {
  style?: CSSProperties
}

export const Bar: React.FC<BarProps> = props => {
  return (
    <div className='bar' style={props.style}>
      {props.children}
    </div>
  )
}
