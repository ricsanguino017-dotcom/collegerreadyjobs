// pages/api/parse-resume.js
// Real PDF and DOCX parsing on the server — no more "paste text below"

import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false, // required for file uploads
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = formidable({ maxFileSize: 5 * 1024 * 1024 }) // 5MB limit

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = Array.isArray(files.resume) ? files.resume[0] : files.resume
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const ext = file.originalFilename?.split('.').pop()?.toLowerCase()
    const buffer = fs.readFileSync(file.filepath)
    let text = ''

    if (ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      text = data.text
    } else if (ext === 'docx' || ext === 'doc') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (ext === 'txt') {
      text = buffer.toString('utf-8')
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' })
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath)

    if (!text || text.trim().length < 50) {
      return res.status(422).json({ error: 'Could not extract text. Try a text-based PDF (not scanned).' })
    }

    return res.status(200).json({ text: text.trim() })
  } catch (err) {
    console.error('Parse error:', err)
    return res.status(500).json({ error: 'Failed to parse file: ' + err.message })
  }
}
