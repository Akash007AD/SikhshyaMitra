import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, School, CheckCircle2, Upload, AlertCircle } from "lucide-react"
import { useNavigate } from 'react-router-dom'

const STEPS = ['School Info', 'Admin Account', 'Review']

export default function Signup({ onSignupSuccess }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [registered, setRegistered] = useState(false)
  const [tenantId, setTenantId] = useState(null)

  const [formData, setFormData] = useState({
    schoolName: '',
    host: '',
    type: 'Primary',
    board: 'CBSE',
    udiseCode: '',
    principalEmail: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  })

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  // Auto-generate subdomain slug from school name
  const handleSchoolNameChange = (name) => {
    update('schoolName', name)
    const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 30)
    update('host', slug + '.schoolplatform.in')
  }

  const validateStep = () => {
    if (step === 0) {
      if (!formData.schoolName) return 'School name is required'
      if (formData.udiseCode && !/^\d{11}$/.test(formData.udiseCode))
        return 'UDISE code must be exactly 11 digits'
    }
    if (step === 1) {
      if (!formData.username || formData.username.length < 3)
        return 'Username must be at least 3 characters'
      if (!formData.password || formData.password.length < 8)
        return 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(formData.password)) return 'Password must contain at least one uppercase letter'
      if (!/[0-9]/.test(formData.password)) return 'Password must contain at least one digit'
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
      if (!formData.agreedToTerms) return 'You must agree to the Terms of Service'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          host: formData.host,
          type: formData.type,
          board: formData.board,
          udiseCode: formData.udiseCode,
          principalEmail: formData.principalEmail,
          username: formData.username,
          password: formData.password
        })
      })
      const data = await res.json()
      if (res.ok) {
        setTenantId(data.tenantId)
        setRegistered(true)
        // We DON'T call onSignupSuccess immediately — they land on the verification pending page
        // They can still log in, but the dashboard will show the verification banner
        onSignupSuccess(data.accessToken, data.verificationStatus)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Could not connect to the server')
    }
    setLoading(false)
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (registered) {
    return <VerificationPendingScreen schoolName={formData.schoolName} navigate={navigate} />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Button>

      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-2xl"
        style={{ animation: 'slideUp 0.5s ease-out' }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/40">
            <School className="h-7 w-7 text-indigo-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your School</h1>
          <p className="text-center text-sm text-slate-400">
            Start with a free trial — full access after document verification
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all
                  ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20' : 'bg-white/10 text-slate-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-indigo-300' : 'text-slate-500'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 mb-5 h-px flex-1 transition-all ${i < step ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 0: School Info */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field label="School Name *">
              <input
                id="school-name"
                type="text"
                value={formData.schoolName}
                onChange={e => handleSchoolNameChange(e.target.value)}
                placeholder="e.g. Springfield High School"
                className={inputClass}
              />
            </Field>

            <Field label="Your Subdomain (auto-generated)">
              <input
                type="text"
                value={formData.host}
                onChange={e => update('host', e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">This will be your school's URL</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="School Type">
                <select id="school-type" value={formData.type} onChange={e => update('type', e.target.value)} className={inputClass}>
                  <option value="Primary">Primary (Std 1-4)</option>
                  <option value="High">High School (Std 5-12)</option>
                  <option value="Senior">Senior Secondary (Std 11-12)</option>
                </select>
              </Field>
              <Field label="Board">
                <select id="school-board" value={formData.board} onChange={e => update('board', e.target.value)} className={inputClass}>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="STATE">State Board</option>
                  <option value="IB">IB</option>
                </select>
              </Field>
            </div>

            <Field label="UDISE Code (optional but recommended)">
              <input
                id="udise-code"
                type="text"
                value={formData.udiseCode}
                onChange={e => update('udiseCode', e.target.value)}
                placeholder="11-digit Ministry of Education code"
                maxLength={11}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Providing your UDISE code speeds up verification. Find it at udiseplus.gov.in
              </p>
            </Field>

            <Field label="Principal's Email (can be personal)">
              <input
                id="principal-email"
                type="email"
                value={formData.principalEmail}
                onChange={e => update('principalEmail', e.target.value)}
                placeholder="principal@gmail.com or school@edu.in"
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {/* Step 1: Admin Account */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="Admin Username *">
              <input
                id="admin-username"
                type="text"
                value={formData.username}
                onChange={e => update('username', e.target.value)}
                placeholder="e.g. principal_sharma"
                className={inputClass}
              />
            </Field>

            <Field label="Password *">
              <input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={inputClass}
              />
            </Field>

            <Field label="Confirm Password *">
              <input
                id="admin-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                placeholder="Repeat your password"
                className={inputClass}
              />
            </Field>

            {/* Password strength indicator */}
            {formData.password && <PasswordStrength password={formData.password} />}

            <label className="mt-2 flex cursor-pointer items-start gap-3">
              <input
                id="agree-terms"
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={e => update('agreedToTerms', e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-indigo-500"
              />
              <span className="text-sm text-slate-400">
                I agree to the{' '}
                <a href="/terms" className="text-indigo-400 underline hover:text-indigo-300">Terms of Service</a>
                {' '}and confirm that I am authorized to register this school. Providing false information
                may result in legal action under the IT Act 2000.
              </span>
            </label>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">School Details</div>
              <ReviewRow label="Name" value={formData.schoolName} />
              <ReviewRow label="URL" value={formData.host} />
              <ReviewRow label="Type" value={formData.type} />
              <ReviewRow label="Board" value={formData.board} />
              {formData.udiseCode && <ReviewRow label="UDISE" value={formData.udiseCode} />}
              {formData.principalEmail && <ReviewRow label="Email" value={formData.principalEmail} />}
              <div className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Admin</div>
              <ReviewRow label="Username" value={formData.username} />
            </div>

            {/* What happens next */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-300">
              <p className="mb-2 font-semibold">After registration:</p>
              <ul className="list-disc list-inside space-y-1 text-indigo-400/80 text-xs">
                <li>You'll get <strong>trial access</strong> to explore all features</li>
                <li>Upload 1–2 verification documents in the dashboard</li>
                <li>We review within <strong>24–48 hours</strong></li>
                <li>On approval, full access is activated</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => { setError(null); setStep(s => s - 1) }}
              className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 rounded-xl bg-indigo-500 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue →
            </button>
          ) : (
            <button
              id="signup-submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-500 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register School'}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-semibold text-indigo-400 hover:text-indigo-300">
            Sign in
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

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition-all"

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 text-slate-400">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const color = score === 3 ? 'bg-emerald-500' : score === 2 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? color : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function VerificationPendingScreen({ schoolName, navigate }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 text-center">
      <div className="relative max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-2xl"
           style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">You're In! 🎉</h2>
        <p className="mb-4 text-slate-400">
          <strong className="text-white">{schoolName}</strong> has been registered. You now have trial access.
        </p>

        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm text-amber-300">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Upload className="h-4 w-4" /> Next: Upload Verification Documents
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-400/80 text-xs">
            <li>School Recognition Certificate</li>
            <li>UDISE registration printout</li>
            <li>Principal's government ID</li>
          </ul>
          <p className="mt-2 text-xs text-amber-500/70">
            We'll review within 24–48 hours and activate full access.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white transition-all hover:bg-indigo-400"
        >
          Go to Dashboard →
        </button>
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
