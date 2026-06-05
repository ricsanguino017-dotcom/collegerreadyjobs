// pages/api/auth.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, password, name, major } = req.body

  if (action === 'signup') {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, major } }
      })

      console.log('Signup result:', JSON.stringify({ data: data?.user?.id, error }))

      if (error) return res.status(400).json({ error: error.message })
      if (!data?.user) return res.status(400).json({ error: 'No user returned from Supabase' })

      // Try profile save separately — non-blocking
      try {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        await admin.from('profiles').upsert({
          id: data.user.id,
          name: name || email.split('@')[0],
          major: major || 'Business Administration',
          updated_at: new Date().toISOString()
        })
      } catch(profileErr) {
        console.error('Profile error (non-fatal):', profileErr.message)
      }

      return res.status(200).json({
        user: { id: data.user.id, email: data.user.email },
        session: data.session
      })

    } catch(err) {
      console.error('Signup crash:', err.message)
      return res.status(500).json({ error: 'Server error: ' + err.message })
    }
  }

  if (action === 'signin') {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return res.status(400).json({ error: error.message })

      let profile = {}
      try {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { data: p } = await admin.from('profiles').select('*').eq('id', data.user.id).single()
        if (p) profile = p
      } catch(e) {}

      return res.status(200).json({ user: data.user, session: data.session, profile })
    } catch(err) {
      return res.status(500).json({ error: 'Server error: ' + err.message })
    }
  }

  if (action === 'signout') {
    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ error: 'Unknown action: ' + action })
}
