// pages/api/reports.js
// Save and retrieve ATS reports from Supabase — real cloud persistence

import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  // Verify user session
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' })

  if (req.method === 'POST') {
    // Save a new report
    const { score, text, jobTitle, date } = req.body
    if (!score || !text) return res.status(400).json({ error: 'Missing score or text' })

    const { data, error } = await supabaseAdmin
      .from('ats_reports')
      .insert({
        user_id: user.id,
        score: parseInt(score),
        text,
        job_title: jobTitle || 'Unknown role',
        created_at: date || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ report: data })
  }

  if (req.method === 'GET') {
    // Get all reports for this user
    const { data, error } = await supabaseAdmin
      .from('ats_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ reports: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing report id' })

    const { error } = await supabaseAdmin
      .from('ats_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // security: can only delete own reports

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
