import { useState } from 'react'
import { Award, Lock, Unlock, Save, FileText, CheckCircle2 } from 'lucide-react'

const DEMO_EXAMS = [
  { id: 'ex-001', name: 'Term 1 Mid-Term Examination', term: 'TERM_1', status: 'MARKS_ENTRY' },
  { id: 'ex-002', name: 'Unit Test 1', term: 'UNIT_TEST', status: 'PUBLISHED' },
]

const DEMO_STUDENT_MARKS = [
  { studentId: 's-001', rollNumber: 1, name: 'Aarav Sharma', marks: 88, isAbsent: false, grade: 'A2' },
  { studentId: 's-002', rollNumber: 2, name: 'Diya Patel', marks: 95, isAbsent: false, grade: 'A1' },
  { studentId: 's-003', rollNumber: 3, name: 'Kabir Verma', marks: 74, isAbsent: false, grade: 'B1' },
  { studentId: 's-004', rollNumber: 4, name: 'Rohan Gupta', marks: 62, isAbsent: false, grade: 'B2' },
  { studentId: 's-005', rollNumber: 5, name: 'Pooja Iyer', marks: 0, isAbsent: true, grade: 'ABS' }
]

export default function ExamsView() {
  const [selectedExam, setSelectedExam] = useState(DEMO_EXAMS[0].id)
  const [selectedSubject, setSelectedSubject] = useState('Mathematics')
  const [marks, setMarks] = useState(DEMO_STUDENT_MARKS)
  const [isLocked, setIsLocked] = useState(false)
  const [reportCardStudent, setReportCardStudent] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const computeGrade = (score, absent) => {
    if (absent) return 'ABS'
    if (score >= 91) return 'A1'
    if (score >= 81) return 'A2'
    if (score >= 71) return 'B1'
    if (score >= 61) return 'B2'
    if (score >= 51) return 'C1'
    if (score >= 41) return 'C2'
    if (score >= 33) return 'D'
    return 'F'
  }

  const handleMarkChange = (studentId, value) => {
    if (isLocked) return
    const num = Math.min(100, Math.max(0, parseFloat(value) || 0))
    setMarks(prev => prev.map(m => {
      if (m.studentId === studentId) {
        return {
          ...m,
          marks: num,
          isAbsent: false,
          grade: computeGrade(num, false)
        }
      }
      return m
    }))
  }

  const handleToggleAbsent = (studentId) => {
    if (isLocked) return
    setMarks(prev => prev.map(m => {
      if (m.studentId === studentId) {
        const nextAbsent = !m.isAbsent
        return {
          ...m,
          isAbsent: nextAbsent,
          marks: nextAbsent ? 0 : m.marks,
          grade: computeGrade(m.marks, nextAbsent)
        }
      }
      return m
    }))
  }

  const handleLockToggle = () => {
    const next = !isLocked
    setIsLocked(next)
    showToast(next ? 'Marks for Mathematics have been LOCKED from edits!' : 'Marks unlocked for revision.')
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 backdrop-blur-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-sm">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Examination & Marks Registry</h1>
            <p className="text-sm text-slate-500">Grading, subject mark entry, lock states & report card issuance</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/70 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            {DEMO_EXAMS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/70 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="Mathematics">Mathematics (Max: 100)</option>
            <option value="Science">Science (Max: 100)</option>
            <option value="English">English (Max: 100)</option>
          </select>

          <button
            onClick={handleLockToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all border shadow-sm ${
              isLocked
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-amber-600" />}
            {isLocked ? 'Marks Locked' : 'Lock Marks'}
          </button>

          <button
            onClick={() => showToast('Marks saved successfully!')}
            disabled={isLocked}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-md transition-all ${
              isLocked
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-blue-500/20'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Marks
          </button>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/40 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 w-20">Roll</th>
                <th className="py-4 px-6">Student</th>
                <th className="py-4 px-6 w-40">Score (Out of 100)</th>
                <th className="py-4 px-6 w-28 text-center">Absent?</th>
                <th className="py-4 px-6 w-28 text-center">Grade</th>
                <th className="py-4 px-6 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {marks.map((entry) => (
                <tr key={entry.studentId} className="hover:bg-white/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">#{entry.rollNumber}</td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-800">{entry.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={isLocked || entry.isAbsent}
                      value={entry.isAbsent ? 0 : entry.marks}
                      onChange={(e) => handleMarkChange(entry.studentId, e.target.value)}
                      className={`w-28 px-3.5 py-1.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                        entry.isAbsent ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={entry.isAbsent}
                      onChange={() => handleToggleAbsent(entry.studentId)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold border ${
                      entry.grade === 'ABS' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                      entry.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      entry.grade.startsWith('B') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      entry.grade.startsWith('C') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {entry.grade}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setReportCardStudent(entry)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Card Modal */}
      {reportCardStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 animate-scale-up border border-slate-100">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">Official Scorecard</span>
                <h2 className="text-xl font-bold text-slate-800">Academic Report Card</h2>
              </div>
              <button onClick={() => setReportCardStudent(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{reportCardStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Roll No:</span>
                <span className="font-bold text-slate-800">#{reportCardStudent.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exam:</span>
                <span className="font-bold text-slate-800">Term 1 Mid-Term</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b">
                <span>Mathematics</span>
                <span className="font-bold">{reportCardStudent.marks} / 100 ({reportCardStudent.grade})</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span>Science</span>
                <span className="font-bold">85 / 100 (A2)</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span>English</span>
                <span className="font-bold">90 / 100 (A1)</span>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between text-emerald-800">
              <div>
                <div className="text-xs uppercase font-bold text-emerald-600">Overall Result</div>
                <div className="text-xl font-black">PASSED (Grade A)</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-600 font-semibold">Total Percentage</div>
                <div className="text-xl font-black">87.6%</div>
              </div>
            </div>

            <button
              onClick={() => setReportCardStudent(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-all"
            >
              Close Scorecard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
