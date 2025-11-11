import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './auth/routes.js'

const app = express()
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => res.json({ ok: 1 }))

app.use('/api/auth', authRoutes)

// TODO: más módulos: /api/business, /api/items, /api/appointments, etc.
export default app
