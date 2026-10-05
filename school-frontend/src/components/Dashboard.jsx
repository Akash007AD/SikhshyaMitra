import { useState, useEffect } from 'react'
import AddStandardModal from './AddStandardModal'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Users, List, Trash2, BookOpen } from "lucide-react"

export default function Dashboard({ token, verificationStatus }) {
  const [standards, setStandards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const schoolId = '22222222-2222-2222-2222-222222222222'

  const fetchStandards = async () => {
    try {
      const res = await fetch(`/api/academic/${schoolId}/standards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStandards(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (token) {
      fetchStandards()
    }
  }, [token])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleStandardAdded = () => {
    setShowModal(false)
    fetchStandards() // Refresh list
  }

  const generateStandards = async (start, end, prefix) => {
    for (let i = start; i <= end; i++) {
      await fetch(`/api/academic/${schoolId}/standards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: `${prefix} ${i}`, sequence: i }) 
      })
    }
    fetchStandards()
  }

  const deleteStandard = async (standardId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    
    try {
      await fetch(`/api/academic/${schoolId}/standards/${standardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchStandards()
      setOpenDropdownId(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="main-content">
      {/* Verification Status Banner */}
      <VerificationBanner status={verificationStatus} />

      {showModal && (
        <AddStandardModal
          token={token}
          schoolId={schoolId}
          onClose={() => setShowModal(false)}
          onStandardAdded={handleStandardAdded}
        />
      )}

      <header className="dashboard-header animate-slide-up delay-2">
        <div className="header-title">
          <h1>Academic Overview</h1>
          <p>Springfield Elementary • 2026-2027</p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-primary" onClick={() => generateStandards(1, 4, 'Class')}>
              Setup Primary (Class 1-4)
            </button>
            <button className="btn-primary" onClick={() => generateStandards(5, 12, 'Class')}>
              Setup High School (Class 5-12)
            </button>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Custom Standard</button>
      </header>

      {/* Stats Glass Cards */}
      <div className="stats-grid animate-slide-up delay-3">
        <div className="stat-card">
          <div className="stat-title">Total Standards</div>
          <div className="stat-value">{standards.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Subjects</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Terms</div>
          <div className="stat-value">1</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="data-card animate-slide-up delay-3" style={{ animationDelay: '0.4s' }}>
        <div className="data-card-header">
          <h2 className="data-card-title">Registered Standards</h2>
        </div>

        <div className="data-list">
          {standards.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No classes found. Did you setup any yet?</p>
          ) : (
            standards.map(s => (
              <div key={s.id} className="list-item" style={{ position: 'relative', overflow: 'visible' }}>
                <div>
                  <div className="item-main" style={{ fontSize: '1.2rem', fontWeight: '500' }}>{s.name}</div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100/50 active:scale-90 transition-all duration-300">
                        <MoreHorizontal className="h-5 w-5 text-slate-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-2xl p-2 animate-in zoom-in-90 fade-in-0 duration-300">
                      <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-white/50 focus:bg-white/50 transition-all duration-200" onClick={() => showToast('Navigate to Sections API coming soon!')}>
                        <List className="mr-2 h-4 w-4" /> Manage Sections
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-white/50 focus:bg-white/50 transition-all duration-200" onClick={() => showToast('Navigate to Students API coming soon!')}>
                        <Users className="mr-2 h-4 w-4" /> View Students
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-white/50 focus:bg-white/50 transition-all duration-200" onClick={() => showToast('Navigate to Subjects API coming soon!')}>
                        <BookOpen className="mr-2 h-4 w-4" /> Assign Subjects
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-black/5 my-1" />
                      <DropdownMenuItem className="cursor-pointer rounded-xl text-red-600 focus:text-red-700 hover:bg-red-50/50 focus:bg-red-50/50 transition-all duration-200" onClick={() => deleteStandard(s.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Standard
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-2xl px-6 py-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/50 hover:scale-105">
            <span className="text-slate-800 font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-800 transition-colors ml-4 font-bold">
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

// ── Verification Status Banner ────────────────────────────────────────────────
function VerificationBanner({ status }) {
  if (!status || status === 'VERIFIED') return null

  const banners = {
    PENDING_VERIFICATION: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: '⚠️',
      text: 'Your school is pending verification. Upload verification documents to activate full access.',
      action: 'Upload Documents',
      color: 'text-amber-300',
      btnClass: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
    },
    DOCS_SUBMITTED: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: '🔍',
      text: 'Documents submitted. Our team is reviewing them (24–48 hours). You have trial access.',
      action: null,
      color: 'text-blue-300',
      btnClass: ''
    },
    TRIAL: {
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      icon: '🎯',
      text: 'Trial mode — all features unlocked. Upload documents to get your VERIFIED badge.',
      action: 'Upload Documents',
      color: 'text-indigo-300',
      btnClass: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30'
    },
    REJECTED: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: '❌',
      text: 'Verification rejected. Check your email for the reason and re-upload corrected documents.',
      action: 'Re-upload',
      color: 'text-red-300',
      btnClass: 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30'
    }
  }

  const b = banners[status]
  if (!b) return null

  return (
    <div className={`mb-6 flex items-center justify-between rounded-2xl border px-5 py-4 ${b.bg}`}>
      <div className={`flex items-center gap-3 text-sm ${b.color}`}>
        <span className="text-lg">{b.icon}</span>
        <span>{b.text}</span>
      </div>
      {b.action && (
        <button className={`ml-4 shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${b.btnClass}`}>
          {b.action}
        </button>
      )}
    </div>
  )
}
