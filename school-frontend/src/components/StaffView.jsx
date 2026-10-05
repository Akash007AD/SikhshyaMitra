import { useState } from 'react'
import { GraduationCap, Plus, Mail, Phone, BookOpen, ShieldCheck, UserCheck } from 'lucide-react'

const INITIAL_STAFF = [
  {
    id: 'st-001',
    employeeId: 'EMP-2026-001',
    firstName: 'Dr. Ramesh',
    lastName: 'Kulkarni',
    designation: 'Head of Mathematics (PGT)',
    department: 'Science & Math',
    email: 'ramesh.k@school.edu.in',
    phone: '+91 98220 11223',
    qualification: 'M.Sc., Ph.D. Mathematics',
    joiningDate: '2019-06-01',
    status: 'ACTIVE',
    classTeacherOf: 'Class 10 - A'
  },
  {
    id: 'st-002',
    employeeId: 'EMP-2026-002',
    firstName: 'Sunita',
    lastName: 'Deshmukh',
    designation: 'Senior Science Teacher (TGT)',
    department: 'Science & Math',
    email: 'sunita.d@school.edu.in',
    phone: '+91 98220 44556',
    qualification: 'M.Sc. Physics, B.Ed.',
    joiningDate: '2021-04-15',
    status: 'ACTIVE',
    classTeacherOf: 'Class 10 - B'
  },
  {
    id: 'st-003',
    employeeId: 'EMP-2026-003',
    firstName: 'Anil',
    lastName: 'Sharma',
    designation: 'English Literature Faculty',
    department: 'Humanities',
    email: 'anil.s@school.edu.in',
    phone: '+91 98220 77889',
    qualification: 'M.A. English, B.Ed.',
    joiningDate: '2022-07-10',
    status: 'ACTIVE',
    classTeacherOf: null
  }
]

export default function StaffView() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const [newStaff, setNewStaff] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    designation: 'Teacher',
    department: 'Academics',
    email: '',
    phone: '',
    qualification: 'B.Ed.',
    joiningDate: new Date().toISOString().split('T')[0]
  })

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleAddStaff = (e) => {
    e.preventDefault()
    if (!newStaff.employeeId || !newStaff.firstName || !newStaff.email) {
      return
    }

    const created = {
      ...newStaff,
      id: `st-${Date.now()}`,
      status: 'ACTIVE',
      classTeacherOf: null
    }

    setStaffList([created, ...staffList])
    setIsAddModalOpen(false)
    showToast(`Staff member ${created.firstName} ${created.lastName} onboarded successfully!`)
    setNewStaff({
      employeeId: '',
      firstName: '',
      lastName: '',
      designation: 'Teacher',
      department: 'Academics',
      email: '',
      phone: '',
      qualification: 'B.Ed.',
      joiningDate: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 backdrop-blur-xl">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-sm">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Faculty & Staff Management</h1>
            <p className="text-sm text-slate-500">Teachers, department educators, class teachers & subject allocation</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {staffList.map((member) => (
          <div
            key={member.id}
            className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                  {member.employeeId}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2">{member.firstName} {member.lastName}</h3>
                <p className="text-xs font-medium text-slate-500">{member.designation}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {member.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{member.qualification}</span>
              </div>
            </div>

            {member.classTeacherOf ? (
              <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-2xl p-3 text-xs flex items-center justify-between text-indigo-900 font-medium">
                <span>Class Teacher</span>
                <span className="font-bold bg-white/80 px-2.5 py-0.5 rounded-lg shadow-2xs">{member.classTeacherOf}</span>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-xs text-slate-400 text-center">
                Subject Teacher
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Add Faculty Member</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.employeeId}
                    onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="EMP-2026-004"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="PGT Mathematics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="Ramesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="Kulkarni"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="teacher@school.edu.in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                    placeholder="+91 98220 12345"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Save Faculty Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
