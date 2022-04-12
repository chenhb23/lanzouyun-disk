import {useEffect, useState} from 'react'
import {Cookie} from 'tough-cookie'
import store from '../common/store'
import {cookieJar} from '../common/cookie'
import config from '../project.config'

const AuthGate = props => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const cookies = store.get('cookies', [])
    // todo: 使用 cookie.domain 而不是 config.lanzouUrl
    Promise.all(cookies.map(cookie => cookieJar.setCookie(Cookie.fromJSON(cookie), config.lanzouUrl))).finally(() => {
      setReady(true)
    })
  }, [])

  return ready ? props.children : null
}

export default AuthGate
