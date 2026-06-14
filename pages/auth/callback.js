export const config = { runtime: 'nodejs' }

export default function handler(req, res) {
  res.setHeader('Location', '/')
  res.statusCode = 302
  res.end()
}
