import React from 'react'
import './Touchable.css'

export interface TouchableProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Touchable: React.FC<TouchableProps> = props => (
  <span {...props} className={`Touchable ${props.className ?? ''}`} />
)
