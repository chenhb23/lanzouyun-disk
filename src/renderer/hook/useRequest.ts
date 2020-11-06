import {useCallback, useState} from 'react'

export function useRequest() {
  const [loading, setLoading] = useState({} as {[key: string]: boolean})
  const request = useCallback(<T>(promiseFn: Promise<T>, loadingKey: string): Promise<T> => {
    setLoading(prevState => ({...prevState, [loadingKey]: true}))
    return promiseFn.finally(() => {
      setLoading(prevState => ({...prevState, [loadingKey]: false}))
    })
  }, [])

  return {loading, request}
}
