// pages/api/reports.js — ATS reports saved to Supabase

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
      .from('ats_reports').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ reports: data })
  }

  if (req.method === 'POST') {
    const { score, text, jobTitle } = req.body
    const { data, error } = await supabaseAdmin.from('ats_reports').insert({
      user_id: user.id, score: parseInt(score), text,
      job_title: jobTitle || 'Unknown role', created_at: new Date().toISOString()
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ report: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabaseAdmin.from('ats_reports')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
