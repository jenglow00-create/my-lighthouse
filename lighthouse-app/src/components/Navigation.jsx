import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, Brain, BarChart3, Settings } from 'lucide-react'

function Navigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: '바다' },
    { path: '/study', icon: BookOpen, label: '공부' },
    { path: '/metacognition', icon: Brain, label: '성찰' },
    { path: '/dashboard', icon: BarChart3, label: '통계' },
    { path: '/settings', icon: Settings, label: '설정' }
  ]

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <span className="lighthouse-icon">🏮</span>
        <h1>등대</h1>
      </div>
      <div className="nav-links">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default Navigation