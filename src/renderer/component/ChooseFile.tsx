import React from 'react'
import './ChooseFile.css'

type OmitType = 'onClick' | 'className' | 'style'

export type UploadProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, OmitType> &
  Pick<React.LabelHTMLAttributes<HTMLLabelElement>, OmitType>

export const ChooseFile: React.FC<UploadProps> = ({onClick, className = '', style, children, ...props}) => {
  return (
    <label
      className={`ChooseFile ${className}`}
      style={style}
      onClick={event => {
        children?.['props']?.onClick?.(event)
        onClick?.(event)
      }}
    >
      <input type={'file'} style={{display: 'none'}} {...props} />
      <span style={{pointerEvents: 'none'}}>{children}</span>
    </label>
  )
}
