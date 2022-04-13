import React, {useMemo} from 'react'
import './Icon.css'

import iconfont from '../libs/iconfont.json'

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

export const Icon: React.FC<IconProps> = ({iconName, className = '', defaultIcon, gutter, ...props}) => {
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
      style={{marginRight: gutter}}
      aria-hidden='true'
      {...props}
    >
      <use href={`#icon-${name}`} />
    </svg>
  )
}

Icon.defaultProps = {
  gutter: 5,
}

export type IconName =
  | 'lock'
  | 'txt'
  | 'mp3'
  | 'db'
  | 'ppt'
  | 'doc'
  | 'xls'
  | 'dmg'
  | 'iso'
  | 'cad'
  | 'exe'
  | 'apk'
  | 'clear'
  | 'split'
  | 'open-folder'
  | 'pause'
  | 'start'
  | 'loading'
  | 'delete'
  | 'file'
  | 'empty'
  | 'right'
  | 'more'
  | 'folder'
  | 'refresh'
  | 'upload'
  | 'zip'
  | 'share'
  | 'finish'
  | 'download'
  | 'pdf'
  | 'new-folder'
  | 'video'
  | 'img'
  | string
