import { pool } from '../db.js'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'
import { sendMail } from '../mailer.js'

const ROLES = new Set(['business','client','admin'])

function signTokens(payload) {
  const access = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${process.env.JWT_ACCESS_MIN || 15}m` })
  const refresh = jwt.sign({ ...payload, typ:'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' })
  return { access, refresh }
}

export async function register({ email, password, role }) {
  if (!ROLES.has(role) || role === 'admin') throw new Error('Rol inválido')
  const [exist] = await pool.query('SELECT id FROM users WHERE email=?', [email])
  if (exist.length) throw new Error('Email ya registrado')
  const hash = await argon2.hash(password)
  const [res] = await pool.query(
    'INSERT INTO users (role,email,password_hash) VALUES (?,?,?)',
    [role, email, hash]
  )
  const userId = res.insertId
  // OTP
  const code = String(Math.floor(100000 + Math.random()*900000))
  const expiresAt = dayjs().add(10,'minute').format('YYYY-MM-DD HH:mm:ss')
  await pool.query(
    'INSERT INTO email_verifications (user_id, code, purpose, expires_at) VALUES (?,?,?,?)',
    [userId, code, 'signup', expiresAt]
  )
  await sendMail({
    to: email,
    subject: 'Tu código de verificación',
    html: `<p>Tu código es <b>${code}</b></p>`
  })
  return { userId }
}

export async function verify({ email, code }) {
  const [[u]] = await pool.query('SELECT id,is_email_verified FROM users WHERE email=?',[email])
  if (!u) throw new Error('Usuario no encontrado')
  const [rows] = await pool.query(
    'SELECT * FROM email_verifications WHERE user_id=? AND purpose="signup" AND used_at IS NULL ORDER BY id DESC LIMIT 1',
    [u.id]
  )
  const rec = rows[0]
  if (!rec) throw new Error('No hay código pendiente')
  if (rec.code !== code) throw new Error('Código inválido')
  if (new Date(rec.expires_at) < new Date()) throw new Error('Código expirado')
  await pool.query('UPDATE email_verifications SET used_at=NOW() WHERE id=?',[rec.id])
  await pool.query('UPDATE users SET is_email_verified=1 WHERE id=?',[u.id])
  return { ok: true }
}

export async function login({ email, password }) {
  const [[u]] = await pool.query('SELECT * FROM users WHERE email=?',[email])
  if (!u) throw new Error('Credenciales inválidas')
  const ok = await argon2.verify(u.password_hash, password)
  if (!ok) throw new Error('Credenciales inválidas')
  if (!u.is_email_verified) throw new Error('Debes verificar tu correo')
  const tokens = signTokens({ uid: u.id, role: u.role })
  return {
    user: { id: u.id, role: u.role, email: u.email },
    ...tokens
  }
}
