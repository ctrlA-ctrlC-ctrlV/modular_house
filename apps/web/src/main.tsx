import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/tokens.css'
import './styles/template.css'
import './index.css'
import './styles/focus.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)