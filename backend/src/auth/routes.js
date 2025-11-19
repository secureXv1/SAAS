// src/auth/routes.js
import { Router } from 'express'
import { z } from 'zod'
import * as svc from './service.js' // asegúrate de tener service.js

const r = Router()

// POST /api/auth/register
r.post('/register', async (req, res) => {
  try {
    const dto = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['business','client'])
    }).parse(req.body)
    const out = await svc.register(dto)
    res.status(201).json({ message: 'Usuario creado. Revisa tu correo para el código.', ...out })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/auth/verify
r.post('/verify', async (req, res) => {
  try {
    const dto = z.object({
      email: z.string().email(),
      code: z.string().length(6)
    }).parse(req.body)
    const out = await svc.verify(dto)
    res.json(out)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/auth/login
r.post('/login', async (req, res) => {
  try {
    const dto = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    }).parse(req.body)
    const out = await svc.login(dto)
    res.json(out)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})


export default r
