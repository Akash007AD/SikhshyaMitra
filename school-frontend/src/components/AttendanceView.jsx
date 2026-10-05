import { useState } from 'react'
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Save, CheckCheck, Users } from 'lucide-react'

// Demo student list for attendance marking
const CLASS_STUDENTS = [
  { id: 's-001', rollNumber: 1, name: 'Aarav Sharma', admissionNumber: 'ADM-2026-001' },
  { id: 's-002', rollNumber: 2, name: 'Diya Patel', admissionNumber: 'ADM-2026-002' },
  { id: 's-003', rollNumber: 3, name: 'Kabir Verma', admissionNumber: 'ADM-2026-004' },
  { id: 's-004', rollNumber: 4, name: 'Rohan Gupta', admissionNumber: 'ADM-2026-005' },
  { id: 's-005', rollNumber: 5, name: 'Pooja Iyer', admissionNumber: 'ADM-2026-006' }
]

export default function AttendanceView() {
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedClass, setSelectedClass] = useState('Class 10')
  const [selectedSection, setSelectedSection] = useState('A')

  // Attendance state per student: { [studentId]: { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', remarks: '' } }
  const [records, setRecords] = useState(() => {
    const init = {}
    CLASS_STUDENTS.forEach(s => {
      init[s.id] = { status: 'PRESENT', remarks: '' }
    })
    return init
  })

  const [toast, setToast] = useState(null)
  const [isSaved, setIsSaved] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
    setIsSaved(false)
  }

  const handleRemarksChange = (studentId, remarks) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }))
    setIsSaved(false)
  }

  const markAllPresent = () => {
    const updated = {}
    CLASS_STUDENTS.forEach(s => {
      updated[s.id] = { ...records[s.id], status: 'PRESENT' }
    })
    setRecords(updated)
    setIsSaved(false)
    showToast('Marked all students as PRESENT!')
  }

  const handleSaveAttendance = () => {
    setIsSaved(true)
    showToast(`Attendance saved for ${selectedClass}-${selectedSection} on ${selectedDate}!`)
  }

  // Stats calculation
  const total = CLASS_STUDENTS.length
  const presentCount = Object.values(records).filter(r => r.status === 'PRESENT').length
  const absentCount = Object.values(records).filter(r => r.status === 'ABSENT').length
  const lateCount = Object.values(records).filter(r => r.status === 'LATE').length
  const excusedCount = Object.values(records).filter(r => r.status === 'EXCUSED').length
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 backdrop-blur-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily Attendance Tracker</h1>
            <p className="text-sm text-slate-500">Record daily pupil attendance, late entries & excusals</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setIsSaved(false)
            }}
            className="px-4 py-2.5 rounded-2xl bg-white/70 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          {/* Class / Section dropdowns */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/70 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="Class 10">Class 10</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/70 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          <button
            onClick={markAllPresent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Mark All Present
          </button>

          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            {isSaved ? 'Saved ✓' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Enrolled</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{total}</div>
        </div>

        <div className="bg-emerald-50/50 backdrop-blur-xl border border-emerald-100 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-xs font-semibold uppercase text-emerald-600">Present</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{presentCount}</div>
        </div>

        <div className="bg-rose-50/50 backdrop-blur-xl border border-rose-100 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-xs font-semibold uppercase text-rose-600">Absent</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{absentCount}</div>
        </div>

        <div className="bg-amber-50/50 backdrop-blur-xl border border-amber-100 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-xs font-semibold uppercase text-amber-600">Late</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{lateCount}</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-blue-50/50 backdrop-blur-xl border border-blue-100 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-xs font-semibold uppercase text-blue-600">Turnout Rate</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{rate}%</div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/40 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 w-20">Roll</th>
                <th className="py-4 px-6">Student Details</th>
                <th className="py-4 px-6">Status Selection</th>
                <th className="py-4 px-6">Remarks / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {CLASS_STUDENTS.map((student) => {
                const cur = records[student.id] || { status: 'PRESENT', remarks: '' }
                return (
                  <tr key={student.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 text-base">#{student.rollNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{student.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{student.admissionNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => {
                          const isActive = cur.status === status
                          const colors = {
                            PRESENT: isActive ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white/80 text-slate-600 hover:bg-emerald-50',
                            ABSENT: isActive ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-white/80 text-slate-600 hover:bg-rose-50',
                            LATE: isActive ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white/80 text-slate-600 hover:bg-amber-50',
                            EXCUSED: isActive ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-white/80 text-slate-600 hover:bg-blue-50'
                          }

                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(student.id, status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200/60 shadow-sm ${colors[status]}`}
                            >
                              {status === 'PRESENT' && 'P'}
                              {status === 'ABSENT' && 'A'}
                              {status === 'LATE' && 'L'}
                              {status === 'EXCUSED' && 'E'}
                              <span className="hidden sm:inline ml-1 font-semibold">{status}</span>
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. sick leave)..."
                        value={cur.remarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/70 border border-slate-200/80 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
