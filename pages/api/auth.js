// pages/api/auth.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, password, name, major } = req.body

  // Log env vars presence (not values)
  console.log('Env check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)
  })

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

      console.log('Signup error:', error?.message, 'User:', data?.user?.id)

      if (error) return res.status(400).json({ error: error.message })
      if (!data?.user) return res.status(400).json({ error: 'No user returned' })

      return res.status(200).json({
        user: { id: data.user.id, email: data.user.email },
        session: data.session
      })

    } catch(err) {
      console.error('Crash:', err.message)
      return res.status(500).json({ error: err.message })
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
      return res.status(200).json({ user: data.user, session: data.session, profile: {} })
    } catch(err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (action === 'signout') {
    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
