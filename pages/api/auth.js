// pages/api/auth.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, password, name, major } = req.body

  if (action === 'signup') {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, major } } })
    if (error) return res.status(400).json({ error: error.message })
    if (!data.user) return res.status(400).json({ error: 'Could not create account' })

    // 2. Try to save profile — don't fail signup if this errors
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        name: name || email.split('@')[0],
        major: major || 'Business Administration',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
    } catch(e) {
      console.error('Profile save error (non-fatal):', e)
    }

    return res.status(200).json({ user: data.user, session: data.session })
  }

  if (action === 'signin') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(400).json({ error: error.message })

    // Fetch profile — don't fail if missing
    let profile = {}
    try {
      const { data: p } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single()
      if (p) profile = p
    } catch(e) {}

    return res.status(200).json({ user: data.user, session: data.session, profile })
  }

  if (action === 'signout') {
    try { await supabase.auth.signOut() } catch(e) {}
    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
