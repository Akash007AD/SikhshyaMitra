import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Login from './components/Login'
import Signup from './components/Signup'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import StudentsView from './components/StudentsView'
import AttendanceView from './components/AttendanceView'
import StaffView from './components/StaffView'
import ExamsView from './components/ExamsView'
import Landing from './components/Landing'

// Set your Google OAuth Client ID here (or via .env as VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [activeTab, setActiveTab] = useState('standards') // 'standards' | 'students' | 'attendance' | 'staff' | 'exams'
  // PENDING_VERIFICATION | DOCS_SUBMITTED | TRIAL | VERIFIED
  const [verificationStatus, setVerificationStatus] = useState(
    () => localStorage.getItem('verificationStatus') || null
  )

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('verificationStatus')
      localStorage.removeItem('refreshToken')
    }
  }, [token])

  useEffect(() => {
    if (verificationStatus) {
      localStorage.setItem('verificationStatus', verificationStatus)
    }
  }, [verificationStatus])

  const handleLoginSuccess = (accessToken, vs) => {
    setToken(accessToken)
    if (vs) setVerificationStatus(vs)
  }

  const handleLogout = () => {
    setToken(null)
    setVerificationStatus(null)
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'students':
        return <StudentsView />
      case 'attendance':
        return <AttendanceView />
      case 'staff':
        return <StaffView />
      case 'exams':
        return <ExamsView />
      case 'standards':
      default:
        return <Dashboard token={token} verificationStatus={verificationStatus} />
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <div className="bg-blob" />

        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Landing />} />

          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLoginSuccess} />}
          />

          <Route
            path="/signup"
            element={token ? <Navigate to="/dashboard" /> : <Signup onSignupSuccess={handleLoginSuccess} />}
          />

          <Route
            path="/dashboard"
            element={
              token ? (
                <div className="app-container">
                  <Sidebar setToken={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
                  {renderActiveView()}
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
