import React from 'react'
import ReactDOMClient from 'react-dom/client'
import App from './App'
import AuthGate from './AuthGate'
import {ConfigProvider} from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'
import {auto} from 'darkreader'

import './index.css'

auto({brightness: 100, contrast: 90, sepia: 10})

const root = ReactDOMClient.createRoot(document.getElementById('root'))
root.render(
  <ConfigProvider locale={zhCN}>
    <AuthGate>
      <App />
    </AuthGate>
  </ConfigProvider>
)
