import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../admin.css'

function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        navigate('/admin/dashboard')
      }
    }

    checkSession()
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setErrorMessage('')

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      setErrorMessage(
        '이메일 또는 비밀번호를 확인해주세요.'
      )

      setLoading(false)
      return
    }

    navigate('/admin/dashboard')
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-brand">
          MRpass
        </div>

        <h1>관리자 로그인</h1>

        <p className="admin-login-description">
          신청자 관리 페이지
        </p>

        <form onSubmit={handleSubmit}>
          <div className="admin-login-group">
            <label htmlFor="adminEmail">
              이메일
            </label>

            <input
              id="adminEmail"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="관리자 이메일"
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-login-group">
            <label htmlFor="adminPassword">
              비밀번호
            </label>

            <input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="비밀번호"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage && (
            <p className="admin-error">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? '로그인 중...'
              : '로그인'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminLogin