import React, {useMemo} from 'react'
import './Icon.css'

import iconfont from './lib/iconfont.json'

// 所有图标名称
export const icons = iconfont.glyphs.map(value => value.font_class)
const iconMap: {[key: string]: IconName} = {
  pptx: 'ppt',
  xlsx: 'xls',
  docx: 'doc',
  tar: 'zip',
  '7z': 'zip',
  rar: 'zip',
}

export type IconProps = {
  iconName: IconName
  defaultIcon?: IconName
  gutter?: number
} & JSX.IntrinsicElements['svg']

export const MyIcon: React.FC<IconProps> = ({iconName, className = '', defaultIcon, gutter, style, ...props}) => {
  iconName = iconMap[iconName] ?? iconName
  const name = useMemo(() => {
    if (!icons.includes(iconName)) {
      return defaultIcon
    }
    return iconName
  }, [defaultIcon, iconName])

  return (
    <svg
      className={`icon ${name === 'loading' ? name : ''} ${className}`}
      style={{marginRight: gutter, ...style}}
      aria-hidden='true'
      {...props}
    >
      <use href={`#icon-${name}`} />
    </svg>
  )
}

MyIcon.defaultProps = {
  gutter: 5,
}
