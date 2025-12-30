import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LegalPage from './components/LegalPage'
import AdminDashboard from './components/AdminDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminDashboard />} />
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
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
