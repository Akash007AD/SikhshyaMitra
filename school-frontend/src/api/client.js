// SikhshyaMitra API Gateway Client

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function getHeaders(token, tenantId) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (tenantId) headers['X-Tenant-ID'] = tenantId
  return headers
}

export const api = {
  // --- AUTH ---
  async login(username, password, host) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Host': host },
      body: JSON.stringify({ username, password })
    })
    return res.json()
  },

  async loginWithGoogle(idToken, host) {
    const res = await fetch(`${API_BASE}/api/auth/oauth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Host': host },
      body: JSON.stringify({ idToken })
    })
    return res.json()
  },

  async register(payload) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return res.json()
  },

  // --- ACADEMICS ---
  async getStandards(schoolId, token, tenantId) {
    const res = await fetch(`${API_BASE}/api/academic/${schoolId}/standards`, {
      headers: getHeaders(token, tenantId)
    })
    return res.json()
  },

  async getStudents(schoolId, token, tenantId, params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE}/api/academic/${schoolId}/students${query ? '?' + query : ''}`
    const res = await fetch(url, { headers: getHeaders(token, tenantId) })
    return res.json()
  },

  async getStaff(schoolId, token, tenantId) {
    const res = await fetch(`${API_BASE}/api/academic/${schoolId}/staff`, {
      headers: getHeaders(token, tenantId)
    })
    return res.json()
  },

  async getAttendance(schoolId, standardId, sectionId, date, token, tenantId) {
    const res = await fetch(
      `${API_BASE}/api/academic/${schoolId}/attendance?standardId=${standardId}&sectionId=${sectionId}&date=${date}`,
      { headers: getHeaders(token, tenantId) }
    )
    return res.json()
  },

  async getExams(schoolId, token, tenantId) {
    const res = await fetch(`${API_BASE}/api/academic/${schoolId}/exams`, {
      headers: getHeaders(token, tenantId)
    })
    return res.json()
  }
}
