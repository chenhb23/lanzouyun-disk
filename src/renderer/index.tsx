import React from 'react'
// import ReactDOMClient from 'react-dom/client'
import ReactDOM from 'react-dom'
import App from './App'
import AuthGate from './AuthGate'

ReactDOM.render(
  <AuthGate>
    <App />
  </AuthGate>,
  document.getElementById('root')
)

// const root = ReactDOMClient.createRoot(document.getElementById('root'))
// root.render(
//   // <React.StrictMode>
//   <AuthGate>
//     <App />
//   </AuthGate>
//   // </React.StrictMode>
// )
