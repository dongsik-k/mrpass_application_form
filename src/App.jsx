import { useState } from 'react'
import { supabase } from './lib/supabase'
import PrivacyPolicy from './components/PrivacyPolicy'
import './App.css'

const REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
]

const CONSENT_VERSION = '2026-08-10-v1'

function App() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    birthDate: '',
    region: '',
    privacyAgreed: false,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const getToday = () => {
    const today = new Date()

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)

    if (numbers.length <= 3) {
      return numbers
    }

    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(
      3,
      7
    )}-${numbers.slice(7)}`
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'phone') {
      setForm((prev) => ({
        ...prev,
        phone: formatPhone(value),
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return '이름을 정확하게 입력해주세요.'
    }

    const phoneNumbers = form.phone.replace(/\D/g, '')

    if (
      phoneNumbers.length !== 10 &&
      phoneNumbers.length !== 11
    ) {
      return '연락처를 정확하게 입력해주세요.'
    }

    if (!form.birthDate) {
      return '생년월일을 입력해주세요.'
    }

    if (!form.region) {
      return '지역을 선택해주세요.'
    }

    if (!form.privacyAgreed) {
      return '개인정보 수집 및 이용에 동의해주세요.'
    }

    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const phoneNumbers = form.phone.replace(/\D/g, '')

      const { error } = await supabase
        .from('leads')
        .insert({
          name: form.name.trim(),
          phone: phoneNumbers,
          birth_date: form.birthDate,
          region: form.region,
          privacy_agreed: true,
          consent_version: CONSENT_VERSION,
        })

      if (error) {
        throw error
      }

      setSuccess(true)

      setForm({
        name: '',
        phone: '',
        birthDate: '',
        region: '',
        privacyAgreed: false,
      })
    } catch (error) {
      console.error(error)

      setErrorMessage(
        '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="page">
        <section className="success-card">
          <div className="success-icon">✓</div>

          <h1>신청이 완료되었습니다.</h1>

          <p>
            접수된 내용을 확인한 후
            <br />
            담당자가 연락드리겠습니다.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setSuccess(false)}
          >
            다시 신청하기
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div className="logo">MRpass</div>

          <h1>
            병원서류 발급,
            <br />
            간편하게 신청하세요
          </h1>

          <p>
            필요한 정보를 남겨주시면
            <br />
            담당자가 확인 후 연락드립니다.
          </p>
        </header>

        <section className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                이름
                <span className="required">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="이름을 입력해주세요"
                value={form.name}
                onChange={handleChange}
                maxLength={50}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                연락처
                <span className="required">*</span>
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                placeholder="010-1234-5678"
                value={form.phone}
                onChange={handleChange}
                maxLength={13}
                autoComplete="tel"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">
                생년월일
                <span className="required">*</span>
              </label>

              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
                max={getToday()}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="region">
                지역
                <span className="required">*</span>
              </label>

              <select
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                required
              >
                <option value="">
                  지역을 선택해주세요
                </option>

                {REGIONS.map((region) => (
                  <option
                    key={region}
                    value={region}
                  >
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="consent-box">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="privacyAgreed"
                  checked={form.privacyAgreed}
                  onChange={handleChange}
                />

                <span>
                  <strong>[필수]</strong>{' '}
                  개인정보 수집 및 이용에 동의합니다.
                </span>
              </label>

              <details className="consent-detail">
                <summary>내용보기</summary>

                <div>
                  <p>
                    <strong>수집 목적</strong>
                    <br />
                    병원서류 발급대행 상담 신청 접수 및 연락
                  </p>

                  <p>
                    <strong>수집 항목</strong>
                    <br />
                    이름, 연락처, 생년월일, 지역
                  </p>

                  <p>
                    <strong>보유 및 이용 기간</strong>
                    <br />
                    [회사 내부 기준에 따른 실제 보유기간 입력]
                  </p>

                  <p>
                    <strong>동의 거부 권리</strong>
                    <br />
                    개인정보 수집 및 이용에 대한 동의를
                    거부할 수 있습니다. 다만 동의를
                    거부할 경우 상담 신청이 제한될 수 있습니다.
                  </p>
                </div>
              </details>
            </div>

            {errorMessage && (
              <p className="error-message">
                {errorMessage}
              </p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? '신청 중...'
                : '상담 신청하기'}
            </button>
          </form>
        </section>

        <div className="safe-text">
          입력하신 정보는 상담 목적으로만 이용됩니다.
        </div>

        <PrivacyPolicy />

        <footer className="footer">
          © 2026 MRpass. All rights reserved.
        </footer>
      </div>
    </main>
  )
}

export default App