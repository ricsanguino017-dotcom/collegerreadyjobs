// pages/api/jobs.js
// Secure Adzuna proxy — API keys never reach the browser

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { what, where, count = 6, type = 'job' } = req.query

  if (!what) {
    return res.status(400).json({ error: 'Missing param: what' })
  }

  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    return res.status(500).json({ error: 'Adzuna keys not configured on server' })
  }

  try {
    const query = type === 'internship' ? `${what} internship` : what
    const params = new URLSearchParams({
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      results_per_page: Math.min(parseInt(count) || 6, 15),
      what: query,
      'content-type': 'application/json',
      sort_by: 'date',
    })
    if (where) params.append('where', where)

    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`
    const response = await fetch(url)

    if (!response.ok) {
      return res.status(response.status).json({ error: `Adzuna error: ${response.status}` })
    }

    const data = await response.json()

    // Strip to only what frontend needs
    const jobs = (data.results || []).map(j => ({
      id: j.id,
      title: j.title,
      company: j.company?.display_name || 'Company not listed',
      location: j.location?.display_name || 'US',
      salary_min: j.salary_min || null,
      salary_max: j.salary_max || null,
      description: j.description ? j.description.substring(0, 200) : '',
      redirect_url: j.redirect_url || '#',
      contract_time: j.contract_time || null,
    }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ results: jobs, total: data.count || 0 })
  } catch (err) {
    console.error('Jobs proxy error:', err)
    return res.status(500).json({ error: 'Failed to fetch jobs' })
  }
}
