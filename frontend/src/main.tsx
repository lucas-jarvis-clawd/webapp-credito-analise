import React from 'react'
import ReactDOM from 'react-dom/client'
import FixedApp from './FixedApp.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FixedApp />
  </React.StrictMode>,
)