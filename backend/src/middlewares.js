import jwt from 'jsonwebtoken'

export function auth(req, res, next){
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error:'No token' })
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.uid, role: payload.role }
    next()
  }catch(e){
    return res.status(401).json({ error:'Invalid token' })
  }
}

export function requireRole(...roles){
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error:'Unauthorized' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error:'Forbidden' })
    }
    next()
  }
}
