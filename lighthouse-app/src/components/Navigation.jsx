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
    <nav className="navigation" aria-label="주요 메뉴">
      <div className="nav-brand">
        <img src={logo} alt="등대 로고" className="nav-logo" />
        <h1>등대</h1>
      </div>
      <ul className="nav-links" role="list">
        {/* eslint-disable-next-line no-unused-vars */}
        {navItems.map(({ path, icon: Icon, label }) => (
          <li key={path}>
            <Link
              to={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              aria-current={location.pathname === path ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-user">
        {currentUser ? (
          <div className="user-section">
            <div className="user-info" aria-label={`로그인됨: ${currentUser.username}`}>
              <User size={16} aria-hidden="true" />
              <span>{currentUser.username}</span>
            </div>
            <button onClick={onLogout} className="logout-btn" aria-label="로그아웃">
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button onClick={onShowAuth} className="login-btn" aria-label="로그인">
            <User size={16} aria-hidden="true" />
            로그인
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navigation