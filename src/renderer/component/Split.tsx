import React, {useEffect, useRef, useState} from 'react'

export interface SplitProps {
  onMove?: (dx: number) => void
  onRelease?: (dx: number) => void
}

export const Split: React.FC<SplitProps> = props => {
  const [isFocus, setIsFocus] = useState(false)
  const startX = useRef(0)

  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      props.onMove?.(ev.clientX - startX.current)
    }
    const onMouseup = (ev: MouseEvent) => {
      props.onRelease?.(ev.clientX - startX.current)
      setIsFocus(false)
    }
    if (isFocus) {
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onMouseup)

      return () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onMouseup)
      }
    }
  }, [isFocus, props])

  return (
    <div
      className='split'
      onMouseDown={event => {
        // clientX
        startX.current = event.clientX
        setIsFocus(true)
      }}
    />
  )
}
