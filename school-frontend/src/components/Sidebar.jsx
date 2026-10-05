import { BookOpen, Users, CalendarCheck, GraduationCap, Award, CreditCard, LogOut } from 'lucide-react'

export default function Sidebar({ setToken, activeTab = 'standards', setActiveTab }) {
  const navItems = [
    { id: 'standards', label: 'Standards & Classes', icon: BookOpen },
    { id: 'students', label: 'Students & Enrollment', icon: Users },
    { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck },
    { id: 'staff', label: 'Staff & Teachers', icon: GraduationCap },
    { id: 'exams', label: 'Exams & Results', icon: Award },
  ]

  return (
    <aside className="sidebar animate-slide-up delay-1">
      <div className="logo flex items-center gap-2 font-bold text-lg text-slate-800 tracking-tight">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          🎓
        </div>
        SikhshyaMitra
      </div>

      <ul className="nav-menu space-y-1 mt-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <li
              key={item.id}
              className={`nav-item flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer font-medium text-sm transition-all ${
                isActive
                  ? 'active bg-blue-600/10 text-blue-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/60'
              }`}
              onClick={() => setActiveTab && setActiveTab(item.id)}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
            </li>
          )
        })}

        <li
          className="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl cursor-not-allowed font-medium text-sm text-slate-400 opacity-60"
          title="Coming in Phase 4"
        >
          <CreditCard className="w-4 h-4" />
          Fee Management
        </li>

        <li
          className="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer font-semibold text-sm text-rose-600 hover:bg-rose-50/80 transition-all mt-auto"
          style={{ marginTop: 'auto' }}
          onClick={() => setToken(null)}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </li>
      </ul>
    </aside>
  )
}
