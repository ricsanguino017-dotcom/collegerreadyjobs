// pages/api/jobs.js
// JSearch (via RapidAPI) proxy — keys never reach the browser

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { what, where, count = 6, type = 'job' } = req.query

  if (!what) {
    return res.status(400).json({ error: 'Missing param: what' })
  }

  if (!process.env.JSEARCH_API_KEY) {
    return res.status(500).json({ error: 'JSEARCH_API_KEY not set in environment variables' })
  }

  try {
    const query = type === 'internship'
      ? `${what} internship`
      : `${what} entry level`

    const params = new URLSearchParams({
      query: where ? `${query} in ${where}` : query,
      page: '1',
      num_pages: '1',
      date_posted: 'month',
    })

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({ error: `JSearch error: ${response.status}` })
    }

    const data = await response.json()

    // Normalize JSearch response to match what frontend expects
    const jobs = (data.data || []).slice(0, parseInt(count) || 6).map(j => ({
      id: j.job_id,
      title: j.job_title,
      company: j.employer_name || 'Company not listed',
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || 'US',
      salary_min: j.job_min_salary || null,
      salary_max: j.job_max_salary || null,
      description: j.job_description ? j.job_description.substring(0, 200) : '',
      redirect_url: j.job_apply_link || j.job_google_link || '#',
      contract_time: j.job_employment_type || null,
    }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ results: jobs, total: jobs.length })

  } catch (err) {
    console.error('JSearch error:', err)
    return res.status(500).json({ error: 'Failed to fetch jobs: ' + err.message })
  }
}
