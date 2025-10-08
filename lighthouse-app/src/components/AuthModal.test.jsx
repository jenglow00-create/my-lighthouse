import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from './AuthModal'

describe('AuthModal', () => {
  const mockOnClose = vi.fn()
  const mockOnAuth = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    mockOnClose.mockClear()
    mockOnAuth.mockClear()
  })

  describe('렌더링', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <AuthModal isOpen={false} onClose={mockOnClose} onAuth={mockOnAuth} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should render dialog when isOpen is true', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('사용자명')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    })

    it('should have proper ARIA attributes', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'auth-modal-title')
    })

    it('should render close button', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)
      expect(screen.getByRole('button', { name: '모달 닫기' })).toBeInTheDocument()
    })
  })

  describe('모드 전환', () => {
    it('should switch to register mode', async () => {
      const user = userEvent.setup()
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      const buttons = screen.getAllByText('회원가입')
      await user.click(buttons[0])

      expect(screen.getByLabelText('이메일')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    })

    it('should clear form when switching modes', async () => {
      const user = userEvent.setup()
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      await user.type(screen.getByLabelText('사용자명'), 'testuser')
      await user.type(screen.getByLabelText('비밀번호'), 'password123')

      const buttons = screen.getAllByText('회원가입')
      await user.click(buttons[0])

      expect(screen.getByLabelText('사용자명')).toHaveValue('')
      expect(screen.getByLabelText('비밀번호')).toHaveValue('')
    })
  })

  describe('로그인', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup()
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        createdAt: new Date().toISOString()
      }
      localStorage.setItem('lighthouse-users', JSON.stringify([mockUser]))

      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      await user.type(screen.getByLabelText('사용자명'), 'testuser')
      await user.type(screen.getByLabelText('비밀번호'), 'password123')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      expect(mockOnAuth).toHaveBeenCalledWith(mockUser)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('회원가입', () => {
    it('should successfully register with valid data', async () => {
      const user = userEvent.setup()
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      const buttons = screen.getAllByText('회원가입')
      await user.click(buttons[0])

      await user.type(screen.getByLabelText('사용자명'), 'newuser')
      await user.type(screen.getByLabelText('이메일'), 'new@example.com')
      await user.type(screen.getByLabelText('비밀번호'), 'password123')
      await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
      await user.click(screen.getByRole('button', { name: '회원가입' }))

      expect(mockOnAuth).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()

      const users = JSON.parse(localStorage.getItem('lighthouse-users'))
      expect(users).toHaveLength(1)
      expect(users[0].username).toBe('newuser')
      expect(users[0].email).toBe('new@example.com')
    })
  })

  describe('키보드 접근성', () => {
    it('should close modal on Escape key press', async () => {
      const user = userEvent.setup()
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should focus first input when modal opens', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)
      expect(screen.getByLabelText('사용자명')).toHaveFocus()
    })
  })

  describe('사용자 상호작용', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      await user.click(screen.getByRole('button', { name: '모달 닫기' }))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should update form data on input change', async () => {
      const user = userEvent.setup()
      render(<AuthModal isOpen={true} onClose={mockOnClose} onAuth={mockOnAuth} />)

      const usernameInput = screen.getByLabelText('사용자명')
      const passwordInput = screen.getByLabelText('비밀번호')

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')

      expect(usernameInput).toHaveValue('testuser')
      expect(passwordInput).toHaveValue('password123')
    })
  })
})
