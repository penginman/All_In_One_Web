import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.PROD ? '/All_In_One_Web' : '/'}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
