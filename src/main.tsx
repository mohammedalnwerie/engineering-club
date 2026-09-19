import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

if (typeof window !== 'undefined') {
  console.log(
    '%c UP Engineering Club %c Platform Architect & Developer: Eng. Mohammed Al-Nwerie %c https://github.com/mohammedalnwerie ',
    'background:#7F1AB2;color:#ffffff;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;',
    'background:#00E5FF;color:#0B132B;font-weight:bold;padding:4px 8px;',
    'background:#0B132B;color:#94A3B8;padding:4px 8px;border-radius:0 4px 4px 0;'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)