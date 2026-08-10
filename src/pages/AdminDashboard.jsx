import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import '../admin.css'

const formatPhone = (phone) => {
  if (!phone) return '-'

  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-${phone.slice(
      3,
      7
    )}-${phone.slice(7)}`
  }

  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(
      3,
      6
    )}-${phone.slice(6)}`
  }

  return phone
}

const formatDateTime = (value) => {
  if (!value) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function AdminDashboard() {
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] =
    useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        navigate('/admin')
        return
      }

      await fetchLeads()
    }

    initialize()
  }, [navigate])

  const fetchLeads = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('leads')
      .select(
        `
          id,
          name,
          phone,
          birth_date,
          region,
          privacy_agreed,
          consent_at,
          created_at
        `
      )
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)

      setErrorMessage(
        '신청자 정보를 불러오지 못했습니다.'
      )

      setLoading(false)
      return
    }

    setLeads(data ?? [])
    setLoading(false)
  }

  const filteredLeads = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .replace(/\D/g, '')
        .toLowerCase()

    const textSearch =
      searchTerm.trim().toLowerCase()

    return leads.filter((lead) => {
      const createdAt = new Date(
        lead.created_at
      )

      if (startDate) {
        const start = new Date(
          `${startDate}T00:00:00+09:00`
        )

        if (createdAt < start) {
          return false
        }
      }

      if (endDate) {
        const end = new Date(
          `${endDate}T23:59:59.999+09:00`
        )

        if (createdAt > end) {
          return false
        }
      }

      if (textSearch) {
        const nameMatch = lead.name
          ?.toLowerCase()
          .includes(textSearch)

        const leadPhone =
          lead.phone?.replace(/\D/g, '') ?? ''

        const phoneMatch =
          normalizedSearch.length > 0 &&
          leadPhone.includes(normalizedSearch)

        if (!nameMatch && !phoneMatch) {
          return false
        }
      }

      return true
    })
  }, [
    leads,
    startDate,
    endDate,
    searchTerm,
  ])

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
  }

  const exportExcel = () => {
    if (filteredLeads.length === 0) {
      alert('내보낼 신청자가 없습니다.')
      return
    }

    const excelRows = filteredLeads.map(
      (lead, index) => ({
        번호: index + 1,
        신청일시: formatDateTime(
          lead.created_at
        ),
        이름: lead.name,
        연락처: formatPhone(lead.phone),
        생년월일: lead.birth_date,
        지역: lead.region,
        개인정보동의:
          lead.privacy_agreed
            ? '동의'
            : '미동의',
      })
    )

    const worksheet =
      XLSX.utils.json_to_sheet(excelRows)

    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
    ]

    const workbook =
      XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      '신청자'
    )

    const today =
      new Date()
        .toISOString()
        .slice(0, 10)

    XLSX.writeFile(
      workbook,
      `MRpass_신청자_${today}.xlsx`
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-logo">
            MRpass
          </div>

          <h1>신청자 관리</h1>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </header>

      <section className="admin-content">
        <section className="summary-grid">
          <div className="summary-card">
            <span>전체 신청자</span>
            <strong>{leads.length}</strong>
          </div>

          <div className="summary-card">
            <span>조회 결과</span>
            <strong>
              {filteredLeads.length}
            </strong>
          </div>
        </section>

        <section className="filter-card">
          <div className="filter-header">
            <h2>신청자 조회</h2>

            <button
              type="button"
              className="reset-button"
              onClick={resetFilters}
            >
              초기화
            </button>
          </div>

          <div className="filter-grid">
            <div className="filter-field">
              <label>시작일</label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="filter-field">
              <label>종료일</label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="filter-field search-field">
              <label>
                이름 / 전화번호 검색
              </label>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="예: 홍길동, 01012345678"
              />
            </div>
          </div>
        </section>

        <section className="table-card">
          <div className="table-toolbar">
            <div>
              <h2>신청자 목록</h2>

              <p>
                총 {filteredLeads.length}건
              </p>
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="refresh-button"
                onClick={fetchLeads}
              >
                새로고침
              </button>

              <button
                type="button"
                className="excel-button"
                onClick={exportExcel}
              >
                Excel 다운로드
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="admin-error-box">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              신청자 정보를 불러오는 중입니다.
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="empty-state">
              조건에 맞는 신청자가 없습니다.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="lead-table">
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>신청일시</th>
                    <th>이름</th>
                    <th>연락처</th>
                    <th>생년월일</th>
                    <th>지역</th>
                    <th>개인정보 동의</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map(
                    (lead, index) => (
                      <tr key={lead.id}>
                        <td>
                          {
                            filteredLeads.length -
                            index
                          }
                        </td>

                        <td>
                          {formatDateTime(
                            lead.created_at
                          )}
                        </td>

                        <td className="lead-name">
                          {lead.name}
                        </td>

                        <td>
                          {formatPhone(
                            lead.phone
                          )}
                        </td>

                        <td>
                          {lead.birth_date}
                        </td>

                        <td>{lead.region}</td>

                        <td>
                          <span className="consent-badge">
                            동의
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default AdminDashboard