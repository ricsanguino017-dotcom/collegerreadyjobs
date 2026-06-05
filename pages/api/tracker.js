// pages/api/tracker.js — Application tracker saved to Supabase

import { supabaseAdmin } from '../../lib/supabase'

async function getUser(req) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user || null
}

export default async function handler(req, res) {
  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('applications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ applications: data })
  }

  if (req.method === 'POST') {
    const { company, role, location, status, appliedDate } = req.body
    const { data, error } = await supabaseAdmin.from('applications').insert({
      user_id: user.id, company, role,
      location: location || 'US', status: status || 'applied',
      applied_date: appliedDate || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ application: data })
  }

  if (req.method === 'PATCH') {
    const { id, status, notes } = req.body
    const update = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (notes !== undefined) update.notes = notes
    const { data, error } = await supabaseAdmin.from('applications')
      .update(update).eq('id', id).eq('user_id', user.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ application: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabaseAdmin.from('applications')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
