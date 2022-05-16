import {useEffect, useRef, useState} from 'react'

// 返回两个时间差完成传输的大小，使用 byteToSize 可转化为当前速率
export function useRate(transferred = 0) {
  const queueRef = useRef({prev: 0, next: transferred, date: Date.now()})
  const [diff, setDiff] = useState(0)

  const latest = useRef(transferred)
  latest.current = transferred

  useEffect(() => {
    const queue = queueRef.current

    const now = Date.now()
    const time = now - queue.date
    queue.prev = queue.next
    queue.next = latest.current
    queue.date = now
    setDiff(((queue.next - queue.prev) / time) * 1000)

    const timer = setTimeout(() => setDiff(0), 1000 + 100)
    return () => {
      clearTimeout(timer)
    }
  }, [transferred])

  return diff
}
