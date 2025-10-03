import { Link, useLocation } from 'react-router-dom'
import { Home, Target, BookOpen, Brain, BarChart3, Settings, User, LogOut } from 'lucide-react'
import logo from '../assets/images/logos/등대 로고.png'

function Navigation({ currentUser, onLogout, onShowAuth }) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: '바다' },
    { path: '/goals', icon: Target, label: '목표' },
    { path: '/study', icon: BookOpen, label: '공부' },
    { path: '/metacognition', icon: Brain, label: '성찰' },
    { path: '/dashboard', icon: BarChart3, label: '통계' },
    { path: '/settings', icon: Settings, label: '설정' }
  ]

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <img src={logo} alt="등대 로고" className="nav-logo" />
        <h1>등대</h1>
      </div>
      <div className="nav-links">
        {/* eslint-disable-next-line no-unused-vars */}
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

      <div className="nav-user">
        {currentUser ? (
          <div className="user-section">
            <div className="user-info">
              <User size={16} />
              <span>{currentUser.username}</span>
            </div>
            <button onClick={onLogout} className="logout-btn" title="로그아웃">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={onShowAuth} className="login-btn">
            <User size={16} />
            로그인
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navigation