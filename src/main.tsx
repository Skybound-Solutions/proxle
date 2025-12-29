import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LegalPage from './components/LegalPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/privacy"
          element={
            <LegalPage
              markdownUrl="/docs/PRIVACY_POLICY.md"
              title="Privacy Policy"
            />
          }
        />
        <Route
          path="/terms"
          element={
            <LegalPage
              markdownUrl="/docs/TERMS_OF_SERVICE.md"
              title="Terms of Service"
            />
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
