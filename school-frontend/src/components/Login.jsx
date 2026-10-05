import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock, User } from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // ── Password login ──────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (res.ok) {
        // Store refresh token too
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken)
        }
        onLoginSuccess(data.accessToken, data.verificationStatus)
      } else {
        setLoginError(data.error || 'Invalid credentials')
      }
    } catch {
      setLoginError('Could not connect to Gateway. Is it running?')
    }
    setLoading(false)
  }

  // ── Google OAuth login ───────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setLoginError('')
      try {
        // Exchange the Google access token for a Google ID token
        // Note: useGoogleLogin returns an access token; we need to get the ID token
        // via the credential response. Use the credential flow instead.
        setLoginError('Use the Google button below for ID token flow.')
      } catch {
        setLoginError('Google login failed. Please try again.')
      }
      setGoogleLoading(false)
    },
    onError: () => setLoginError('Google login was cancelled or failed.')
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">

      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Button>

      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-2xl"
        style={{ animation: 'slideUp 0.5s ease-out' }}
      >
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/40">
            <Lock className="h-7 w-7 text-indigo-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-slate-400">Sign in to your EduCore account</p>
        </div>

        {/* Google Sign-In button */}
        <GoogleSignInButton
          onSuccess={(accessToken, verificationStatus, refreshToken) => {
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
            onLoginSuccess(accessToken, verificationStatus)
          }}
          onError={(msg) => setLoginError(msg)}
          loading={googleLoading}
          setLoading={setGoogleLoading}
        />

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-slate-500">or continue with username</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Username / Password form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition-all"
            />
          </div>

          {loginError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {loginError}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          New school?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Register here
          </button>
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Separate Google button component ────────────────────────────────────────
function GoogleSignInButton({ onSuccess, onError, loading, setLoading }) {
  const handleGoogleCredential = async (credentialResponse) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/oauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      })
      const data = await res.json()
      if (res.ok) {
        onSuccess(data.accessToken, data.verificationStatus, data.refreshToken)
      } else {
        onError(data.error || 'Google login failed')
      }
    } catch {
      onError('Google login failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div id="google-signin-wrapper">
      {/* The @react-oauth/google GoogleLogin component renders the branded button */}
      <div
        onClick={() => {
          // Trigger Google One Tap / popup programmatically
          // This is handled by GoogleOAuthProvider in main.jsx
          window.google?.accounts?.id?.prompt()
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? 'Signing in with Google...' : 'Continue with Google'}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}
