// pages/auth/callback.js
// Handles Google OAuth redirect — exchanges code for session then redirects to app

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { code } = req.query

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Redirect to app with session token in hash so frontend can pick it up
      const token = data.session.access_token
      const user = data.user
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      const major = 'Business Administration'

      // Save profile
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      try {
        await admin.from('profiles').upsert({
          id: user.id,
          name,
          major,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
      } catch(e) {}

      // Redirect to main app with token
      return res.redirect(`/?token=${token}&name=${encodeURIComponent(name)}&major=${encodeURIComponent(major)}&id=${user.id}`)
    }
  }

  // Something went wrong — redirect to signin
  return res.redirect('/?error=auth_failed')
}
