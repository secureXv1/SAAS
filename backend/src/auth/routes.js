import { Router } from 'express'
import { register, verify, login } from './service.js'
import { z } from 'zod'

const r = Router()

r.post('/register', async (req, res) => {
  try {
    const dto = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['business','client'])
    }).parse(req.body)
    const out = await register(dto)
    res.status(201).json({ message:'Usuario creado. Revisa tu correo para el código.', ...out })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

r.post('/verify', async (req, res) => {
  try {
    const dto = z.object({
      email: z.string().email(),
      code: z.string().length(6)
    }).parse(req.body)
    const out = await verify(dto)
    res.json(out)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

r.post('/login', async (req, res) => {
  try {
    const dto = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    }).parse(req.body)
    const out = await login(dto)
    res.json(out)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default r
