import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, password, name, major } = req.body

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (action === 'signup') {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, major } } })
      if (error) return res.status(400).json({ error: error.message })
      if (!data?.user) return res.status(400).json({ error: 'Could not create account' })
      try {
        await admin.from('profiles').upsert({
          id: data.user.id,
          name: name || email.split('@')[0],
          major: major || 'Business Administration',
          updated_at: new Date().toISOString()
        })
      } catch(e) { console.warn('Profile save failed (non-fatal):', e.message) }
      return res.status(200).json({ user: { id: data.user.id, email: data.user.email }, session: data.session })
    } catch(err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (action === 'signin') {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return res.status(400).json({ error: error.message })
      let profile = {}
      try {
        const { data: p } = await admin.from('profiles').select('*').eq('id', data.user.id).single()
        if (p) profile = p
      } catch(e) {}
      return res.status(200).json({ user: data.user, session: data.session, profile })
    } catch(err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (action === 'me') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) return res.status(401).json({ error: 'No token' })
      const { data: { user }, error } = await admin.auth.getUser(token)
      if (error || !user) return res.status(401).json({ error: 'Session expired' })
      let profile = {}
      try {
        const { data: p } = await admin.from('profiles').select('*').eq('id', user.id).single()
        if (p) profile = p
      } catch(e) {}
      return res.status(200).json({ user, profile })
    } catch(err) {
      return res.status(401).json({ error: 'Session expired' })
    }
  }

  if (action === 'reset') {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: (process.env.NEXT_PUBLIC_APP_URL || 'https://collegerreadyjobs.vercel.app') + '/reset-password'
      })
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true })
    } catch(err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (action === 'signout') {
    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
