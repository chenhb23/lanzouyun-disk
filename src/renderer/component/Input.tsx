import React, {useRef} from 'react'
import './Input.css'

export type InputProps = {
  //
} & JSX.IntrinsicElements['input']

export const Input: React.FC<InputProps> = ({className = '', value, ...props}) => {
  return <input className={`Input ${className}`} value={value ?? ''} {...props} />
}

export type TextareaProps = {
  // value: JSX.IntrinsicElements['textarea']['value']
} & JSX.IntrinsicElements['textarea']

export const Textarea: React.FC<TextareaProps> = ({className = '', value, maxLength, onChange, ...props}) => {
  const span = useRef(null)

  return (
    <div style={{position: 'relative'}}>
      <textarea
        value={value ?? ''}
        className={`Textarea ${className}`}
        maxLength={maxLength}
        onChange={event => {
          onChange?.(event)
          if (span.current && maxLength) {
            span.current.innerHTML = numberOfWords(event.target.value, maxLength)
          }
        }}
        {...props}
      />
      {maxLength && (
        <span ref={span} className='TextareaNumber'>
          {numberOfWords(value, maxLength)}
        </span>
      )}
    </div>
  )
}

function numberOfWords(value, maxLength) {
  return `${value?.length || 0}/${maxLength}`
}
