// pages/api/profile.js — Save and load user profile from Supabase

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
      .from('profiles').select('*').eq('id', user.id).single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ profile: data })
  }

  if (req.method === 'POST') {
    const { name, major, location, careerGoal, targetRole, skills, university, graduationYear, experienceLevel, jobStatus, gpa } = req.body
    const { data, error } = await supabaseAdmin.from('profiles').upsert({
      id: user.id, name, major, location,
      career_goal: careerGoal, target_role: targetRole,
      skills, university, graduation_year: graduationYear,
      experience_level: experienceLevel, job_status: jobStatus, gpa,
      updated_at: new Date().toISOString()
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ profile: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
