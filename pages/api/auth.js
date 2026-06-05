// pages/api/auth.js
// Handles sign up, sign in, sign out via Supabase Auth

import { supabase, supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, password, name, major } = req.body

  if (action === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, major } }
    })
    if (error) return res.status(400).json({ error: error.message })

    // Save extra profile data
    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        name,
        major: major || 'Business Administration',
        updated_at: new Date().toISOString()
      })
    }
    return res.status(200).json({ user: data.user, session: data.session })
  }

  if (action === 'signin') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(400).json({ error: error.message })

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return res.status(200).json({ user: data.user, session: data.session, profile })
  }

  if (action === 'signout') {
    await supabase.auth.signOut()
    return res.status(200).json({ success: true })
  }

  if (action === 'me') {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Invalid session' })
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single()
    return res.status(200).json({ user, profile })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
