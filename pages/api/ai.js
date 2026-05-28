// pages/api/ai.js
// Secure Claude AI proxy — API key never reaches the browser

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, maxTokens = 1000 } = req.body

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' })
  }

  // Optional: verify user session before allowing AI calls
  // This prevents non-users from burning your API credits
  // const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1])
  // if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: Math.min(maxTokens, 2000), // cap to control costs
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: `Anthropic error: ${response.status}`, detail: err })
    }

    const data = await response.json()
    const text = data.content.map(c => c.text || '').join('')

    // Cache simple responses for 5 minutes to reduce API costs
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ result: text })
  } catch (err) {
    console.error('AI proxy error:', err)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
