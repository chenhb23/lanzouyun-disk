import {useRef} from 'react'

export function useLatestRef<T>(value: T) {
  const ref = useRef<T>(null)
  ref.current = value

  return ref
}
