export default function Sidebar({ setToken }) {
  return (
    <aside className="sidebar animate-slide-up delay-1">
      <div className="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        EduCore
      </div>
      
      <ul className="nav-menu">
        <li className="nav-item">Dashboard</li>
        <li className="nav-item active">Academics (Standards)</li>
        <li className="nav-item">Fee Management</li>
        <li className="nav-item" style={{ marginTop: 'auto', color: '#e74c3c' }} onClick={() => setToken(null)}>Log Out</li>
      </ul>
    </aside>
  )
}
