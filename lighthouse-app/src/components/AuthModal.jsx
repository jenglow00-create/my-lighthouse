import { useState, useEffect, useRef } from 'react'
import FocusLock from 'react-focus-lock'
import { X, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react'

function AuthModal({ isOpen, onClose, onAuth }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const firstInputRef = useRef(null)

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      // Registration validation
      if (!formData.username.trim()) {
        setError('사용자명을 입력해주세요')
        return
      }
      if (!formData.email.trim()) {
        setError('이메일을 입력해주세요')
        return
      }
      if (!formData.email.includes('@')) {
        setError('올바른 이메일 형식을 입력해주세요')
        return
      }
      if (formData.password.length < 4) {
        setError('비밀번호는 4자 이상이어야 합니다')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다')
        return
      }

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('lighthouse-users') || '[]')
      if (existingUsers.find(user => user.username === formData.username)) {
        setError('이미 존재하는 사용자명입니다')
        return
      }
      if (existingUsers.find(user => user.email === formData.email)) {
        setError('이미 존재하는 이메일입니다')
        return
      }

      // Register new user
      const newUser = {
        id: Date.now(),
        username: formData.username,
        email: formData.email,
        password: formData.password, // In real app, this should be hashed
        createdAt: new Date().toISOString()
      }

      const updatedUsers = [...existingUsers, newUser]
      localStorage.setItem('lighthouse-users', JSON.stringify(updatedUsers))
      localStorage.setItem('lighthouse-current-user', JSON.stringify(newUser))

      onAuth(newUser)
      resetForm()
      onClose()
    } else {
      // Login validation
      if (!formData.username.trim()) {
        setError('사용자명을 입력해주세요')
        return
      }
      if (!formData.password.trim()) {
        setError('비밀번호를 입력해주세요')
        return
      }

      // Check user credentials
      const existingUsers = JSON.parse(localStorage.getItem('lighthouse-users') || '[]')
      const user = existingUsers.find(user =>
        user.username === formData.username && user.password === formData.password
      )

      if (!user) {
        setError('사용자명 또는 비밀번호가 올바르지 않습니다')
        return
      }

      localStorage.setItem('lighthouse-current-user', JSON.stringify(user))
      onAuth(user)
      resetForm()
      onClose()
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setError('')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    resetForm()
  }

  if (!isOpen) return null

  return (
    <FocusLock>
      <div
        className="auth-modal-overlay"
        role="dialog"
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        onKeyDown={handleKeyDown}
      >
        <div className="auth-modal">
          <div className="auth-header">
            <h2 id="auth-modal-title">
              {mode === 'login' ? (
                <>
                  <LogIn size={24} aria-hidden="true" />
                  로그인
                </>
              ) : (
                <>
                  <UserPlus size={24} aria-hidden="true" />
                  회원가입
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              className="close-btn"
              aria-label="모달 닫기"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="auth-username">
                <User size={16} aria-hidden="true" />
                사용자명
              </label>
              <input
                id="auth-username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="사용자명을 입력하세요"
                ref={firstInputRef}
                autoFocus
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="auth-email">
                  <Mail size={16} aria-hidden="true" />
                  이메일
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-password">
                <Lock size={16} aria-hidden="true" />
                비밀번호
              </label>
              <input
                id="auth-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="auth-confirm-password">
                  <Lock size={16} aria-hidden="true" />
                  비밀번호 확인
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
            )}

            {error && (
              <div className="error-message" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <div className="auth-actions">
              <button type="submit" className="btn-primary">
                {mode === 'login' ? '로그인' : '회원가입'}
              </button>
            </div>

            <div className="auth-switch">
              {mode === 'login' ? (
                <p>
                  계정이 없으신가요?{' '}
                  <button type="button" onClick={switchMode} className="link-btn">
                    회원가입
                  </button>
                </p>
              ) : (
                <p>
                  이미 계정이 있으신가요?{' '}
                  <button type="button" onClick={switchMode} className="link-btn">
                    로그인
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </FocusLock>
  )
}

export default AuthModal