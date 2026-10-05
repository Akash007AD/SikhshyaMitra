import { useState } from 'react'
import { Plus, Upload, Search, Users, AlertCircle, CheckCircle2, UserCheck, Phone } from 'lucide-react'

// Demo data for preview/fallback
const INITIAL_STUDENTS = [
  {
    id: 's-001',
    rollNumber: 1,
    admissionNumber: 'ADM-2026-001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    standardName: 'Class 10',
    sectionName: 'A',
    dateOfBirth: '2010-04-15',
    gender: 'MALE',
    bloodGroup: 'B+',
    guardianName: 'Rajesh Sharma',
    guardianPhone: '+91 98765 43210',
    guardianEmail: 'rajesh.sharma@example.com',
    status: 'ACTIVE',
    hasSibling: true,
  },
  {
    id: 's-002',
    rollNumber: 2,
    admissionNumber: 'ADM-2026-002',
    firstName: 'Diya',
    lastName: 'Patel',
    standardName: 'Class 10',
    sectionName: 'A',
    dateOfBirth: '2010-09-22',
    gender: 'FEMALE',
    bloodGroup: 'O+',
    guardianName: 'Kirit Patel',
    guardianPhone: '+91 98123 45678',
    guardianEmail: 'kirit.patel@example.com',
    status: 'ACTIVE',
    hasSibling: false,
  },
  {
    id: 's-003',
    rollNumber: 3,
    admissionNumber: 'ADM-2026-003',
    firstName: 'Ananya',
    lastName: 'Sharma',
    standardName: 'Class 8',
    sectionName: 'B',
    dateOfBirth: '2012-11-05',
    gender: 'FEMALE',
    bloodGroup: 'B+',
    guardianName: 'Rajesh Sharma',
    guardianPhone: '+91 98765 43210',
    guardianEmail: 'rajesh.sharma@example.com',
    status: 'ACTIVE',
    hasSibling: true, // Sibling of Aarav
  },
  {
    id: 's-004',
    rollNumber: 4,
    admissionNumber: 'ADM-2026-004',
    firstName: 'Kabir',
    lastName: 'Verma',
    standardName: 'Class 10',
    sectionName: 'B',
    dateOfBirth: '2010-01-30',
    gender: 'MALE',
    bloodGroup: 'A+',
    guardianName: 'Vikas Verma',
    guardianPhone: '+91 97890 12345',
    guardianEmail: 'vikas.verma@example.com',
    status: 'ACTIVE',
    hasSibling: false,
  }
]

export default function StudentsView() {
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStandard, setSelectedStandard] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Form state for single student
  const [newStudent, setNewStudent] = useState({
    rollNumber: '',
    admissionNumber: '',
    firstName: '',
    lastName: '',
    standardName: 'Class 10',
    sectionName: 'A',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
  })

  // State for CSV import
  const [csvText, setCsvText] = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardianPhone.includes(searchQuery)
    const matchesStandard = selectedStandard === 'ALL' || s.standardName === selectedStandard
    return matchesSearch && matchesStandard
  })

  // Sibling detector map
  const phoneCounts = students.reduce((acc, s) => {
    acc[s.guardianPhone] = (acc[s.guardianPhone] || 0) + 1
    return acc
  }, {})

  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newStudent.firstName || !newStudent.admissionNumber || !newStudent.guardianPhone) {
      showToast('Please fill all required fields', 'error')
      return
    }

    // Check duplicate admission number
    if (students.some(s => s.admissionNumber.toLowerCase() === newStudent.admissionNumber.toLowerCase())) {
      showToast(`Admission number ${newStudent.admissionNumber} already exists!`, 'error')
      return
    }

    const created = {
      ...newStudent,
      id: `s-${Date.now()}`,
      rollNumber: parseInt(newStudent.rollNumber) || students.length + 1,
      status: 'ACTIVE'
    }

    setStudents([created, ...students])
    setIsAddModalOpen(false)
    showToast(`Enrolled ${created.firstName} ${created.lastName} successfully!`)
    setNewStudent({
      rollNumber: '',
      admissionNumber: '',
      firstName: '',
      lastName: '',
      standardName: 'Class 10',
      sectionName: 'A',
      dateOfBirth: '',
      gender: 'MALE',
      bloodGroup: 'O+',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
    })
  }

  const handleImportCsv = () => {
    if (!csvText.trim()) {
      showToast('Please paste CSV data', 'error')
      return
    }

    const lines = csvText.trim().split('\n')
    const parsed = []
    let skipped = 0

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('rollnumber')) return
      const cols = line.split(',').map(c => c.trim())
      if (cols.length >= 7) {
        parsed.push({
          id: `csv-${Date.now()}-${idx}`,
          rollNumber: parseInt(cols[0]) || idx + 1,
          admissionNumber: cols[1],
          firstName: cols[2],
          lastName: cols[3],
          standardName: 'Class 10',
          sectionName: 'A',
          dateOfBirth: cols[4] || '2011-01-01',
          gender: cols[5] ? cols[5].toUpperCase() : 'OTHER',
          bloodGroup: 'O+',
          guardianName: cols[6],
          guardianPhone: cols[7] || '',
          guardianEmail: cols[8] || '',
          status: 'ACTIVE'
        })
      } else {
        skipped++
      }
    })

    if (parsed.length > 0) {
      setStudents([...parsed, ...students])
      setIsImportModalOpen(false)
      setCsvText('')
      showToast(`Imported ${parsed.length} students successfully!${skipped > 0 ? ` (${skipped} skipped)` : ''}`)
    } else {
      showToast('No valid rows found in CSV text', 'error')
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-xl ${
            toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-700'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span className="font-semibold text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Student Enrollment & Directory</h1>
              <p className="text-sm text-slate-500">Manage pupil records, roll numbers, sibling links & bulk admissions</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/60 border border-slate-200/80 text-slate-700 text-sm font-semibold hover:bg-white hover:border-slate-300 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Bulk CSV Import
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, admission no, or guardian phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-sm backdrop-blur-md"
          />
        </div>

        <div>
          <select
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
            className="w-full px-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-sm backdrop-blur-md"
          >
            <option value="ALL">All Standards / Classes</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/40 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Roll & Adm No</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6">Class & Sec</th>
                <th className="py-4 px-6">Gender / Blood</th>
                <th className="py-4 px-6">Guardian Info</th>
                <th className="py-4 px-6">Sibling Status</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No student records matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const hasSiblings = phoneCounts[student.guardianPhone] > 1
                  return (
                    <tr key={student.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800">#{student.rollNumber}</span>
                        <div className="text-xs text-slate-400 font-mono">{student.admissionNumber}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-slate-400">DOB: {student.dateOfBirth}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {student.standardName} - {student.sectionName}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-600 font-medium">{student.gender}</span>
                        {student.bloodGroup && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 font-semibold">
                            {student.bloodGroup}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800">{student.guardianName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.guardianPhone}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {hasSiblings ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            👨‍👩‍👧 {phoneCounts[student.guardianPhone]} Enrolled Siblings
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Single Child</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Add New Student</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="e.g. Aarav"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="e.g. Sharma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Admission No *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.admissionNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="ADM-2026-005"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Roll Number *</label>
                  <input
                    type="number"
                    required
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Class / Standard</label>
                  <select
                    value={newStudent.standardName}
                    onChange={(e) => setNewStudent({ ...newStudent, standardName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Blood Group</label>
                  <select
                    value={newStudent.bloodGroup}
                    onChange={(e) => setNewStudent({ ...newStudent, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.guardianName}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="Father / Mother / Guardian"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Guardian Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newStudent.guardianPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Bulk CSV Student Import</h2>
                <p className="text-xs text-slate-500">Paste your CSV records with headers or comma-separated rows</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-mono text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Format:</div>
              <div>RollNumber,AdmissionNumber,FirstName,LastName,DOB(YYYY-MM-DD),Gender,GuardianName,GuardianPhone,GuardianEmail</div>
            </div>

            <textarea
              rows="6"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="1,ADM-2026-005,Rohan,Gupta,2011-03-12,MALE,Sunil Gupta,+91 98765 11111,sunil@example.com&#10;2,ADM-2026-006,Pooja,Iyer,2011-06-25,FEMALE,Ramesh Iyer,+91 98765 22222,ramesh@example.com"
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20"
              >
                Process & Import Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
