import React from 'react'

export interface HeaderProps {
  right?: React.ReactNode
}

export const MyHeader: React.FC<HeaderProps> = props => {
  return (
    <header className='px-3 flex justify-between items-center py-2'>
      <div className='flex flex-1'>{props.children}</div>
      {props.right && <div>{props.right}</div>}
    </header>
  )
}
