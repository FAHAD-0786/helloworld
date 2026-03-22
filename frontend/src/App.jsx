import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AptitudePage from './pages/AptitudePage'
import CodingPage from './pages/CodingPage'
import CommunicationPage from './pages/CommunicationPage'
import CompanyPage from './pages/CompanyPage'
import ProfilePage from './pages/ProfilePage'

function Guard({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0e1320',
            color: '#e8ecf4',
            border: '1px solid #1e2640',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#080b14' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#080b14' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="aptitude"      element={<AptitudePage />} />
          <Route path="coding"        element={<CodingPage />} />
          <Route path="communication" element={<CommunicationPage />} />
          <Route path="company"       element={<CompanyPage />} />
          <Route path="profile"       element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
