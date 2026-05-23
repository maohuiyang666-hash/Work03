import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

const BUILD_INFO = {
  version: '0.1.0',
  buildTime: new Date().toISOString(),
  environment: import.meta.env.MODE,
  commitHash: import.meta.env.VITE_COMMIT_HASH || 'unknown'
};

if (import.meta.env.DEV) {
  console.log('🎮 Build Info:', BUILD_INFO);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)