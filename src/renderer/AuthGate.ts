import {useCallback, useEffect, useState} from 'react'
import {Cookie} from 'tough-cookie'
import store from '../common/store'
import {cookieJar} from '../common/cookie'

// 保证 cookie 已被同步过来
const AuthGate = props => {
  const [ready, setReady] = useState(false)
  const init = useCallback(async () => {
    try {
      const cookies = store.get('cookies', [])
      await Promise.all(
        cookies.map(cookie =>
          cookieJar.setCookie(
            Cookie.fromJSON(cookie),
            (cookie.secure ? 'https://' : 'http://') + cookie.domain.replace(/^\./, '') + cookie.path
          )
        )
      )
    } catch (e) {
      console.log('初始化失败', e)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    init()
  }, [init])

  return ready ? props.children : null
}

export default AuthGate
