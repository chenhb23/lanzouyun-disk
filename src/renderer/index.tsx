import React from 'react'
import ReactDOMClient from 'react-dom/client'
import App from './App'
import AuthGate from './AuthGate'

const root = ReactDOMClient.createRoot(document.getElementById('root'))
root.render(
  // <React.StrictMode>
  <AuthGate>
    <App />
  </AuthGate>
  // </React.StrictMode>
)
