// pages/api/tracker.js
// Application tracker — real database persistence via Supabase

import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ applications: data })
  }

  if (req.method === 'POST') {
    const { company, role, location, status } = req.body
    if (!company || !role) return res.status(400).json({ error: 'Missing company or role' })

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: user.id,
        company,
        role,
        location: location || 'US',
        status: status || 'applied',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ application: data })
  }

  if (req.method === 'PATCH') {
    const { id, status, notes } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const update = {}
    if (status) update.status = status
    if (notes !== undefined) update.notes = notes
    update.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ application: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
