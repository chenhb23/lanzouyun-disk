import {useCallback, useState} from 'react'

export function useLoading() {
  const [loading, setLoading] = useState({} as {[key: string]: boolean})
  // todo: 监听一个异步函数
  const listener = useCallback(<T>(promiseFn: Promise<T>, loadingKey: string): Promise<T> => {
    setLoading(prevState => ({...prevState, [loadingKey]: true}))
    return promiseFn.finally(() => {
      setLoading(prevState => ({...prevState, [loadingKey]: false}))
    })
  }, [])

  return {loading, listener}
}
