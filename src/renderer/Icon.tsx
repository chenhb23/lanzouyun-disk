import React from 'react'

export type IconProps = {
  iconName: string
  gutter?: number
} & JSX.IntrinsicElements['svg']

export const Icon: React.FC<IconProps> = ({iconName, className, gutter, ...props}) => {
  return (
    <svg className={`icon ${className}`} style={{marginRight: gutter}} aria-hidden='true' {...props}>
      <use href={`#icon-${iconName}`} />
    </svg>
  )
}

Icon.defaultProps = {
  gutter: 6,
}
