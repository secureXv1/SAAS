// src/business/routes.js
import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db.js'

const r = Router()

// GET /api/business/plans  → catálogo de planes
r.get('/plans', async (_req, res) => {
  const [rows] = await pool.query('SELECT id,code,name,price_yr,features FROM plans ORDER BY id')
  res.json(rows)
})

// GET /api/business/me  → perfil + plan activo + prefs
r.get('/me', async (req, res) => {
  const uid = req.user.id

  const [[biz]] = await pool.query(
    'SELECT * FROM businesses WHERE owner_user_id=? LIMIT 1', [uid]
  )

  let sub = null, prefs = null, hours = []
  if (biz) {
    const [[s]] = await pool.query(
      `SELECT s.*, p.code AS plan_code, p.name AS plan_name, p.price_yr
       FROM subscriptions s
       JOIN plans p ON p.id=s.plan_id
       WHERE s.business_id=? AND s.status='active'
       ORDER BY s.id DESC LIMIT 1`,
      [biz.id]
    )
    sub = s || null

    const [[p]] = await pool.query(
      'SELECT start_hour, end_hour, slot_min, delivery FROM business_prefs WHERE business_id=?',
      [biz.id]
    )
    prefs = p || null

    const [h] = await pool.query(
      `SELECT dow, is_open, start_min, end_min, slot_min
       FROM business_hours
       WHERE business_id=?
       ORDER BY dow`,
      [biz.id]
    )
    hours = h
  }

  res.json({ business: biz || null, subscription: sub, prefs, hours })
})

/* -------------------------------------------------------
   PERFIL DEL NEGOCIO (sin tocar plan/suscripciones)
------------------------------------------------------- */

// PUT /api/business/me  → crear/actualizar perfil (solo datos)
r.put('/me', async (req, res) => {
  const uid = req.user.id
  const dto = z.object({
    name: z.string().min(2),
    logo_url: z.string().url().optional().or(z.literal('')),
    nit: z.string().optional().or(z.literal('')),
    phone: z.string().min(3),
    email: z.string().email(),
    website: z.string().url().optional().or(z.literal(''))
    // ⛔️ OJO: aquí ya NO se recibe "plan"
  }).parse(req.body)

  // upsert negocio
  const [[exist]] = await pool.query(
    'SELECT id FROM businesses WHERE owner_user_id=? LIMIT 1', [uid]
  )

  let businessId
  if (exist) {
    businessId = exist.id
    await pool.query(
      `UPDATE businesses SET name=?, logo_url=?, nit=?, phone=?, email=?, website=?
       WHERE id=?`,
      [dto.name, dto.logo_url || null, dto.nit || null, dto.phone, dto.email, dto.website || null, businessId]
    )
  } else {
    const [ins] = await pool.query(
      `INSERT INTO businesses (owner_user_id,name,logo_url,nit,phone,email,website)
       VALUES (?,?,?,?,?,?,?)`,
      [uid, dto.name, dto.logo_url || null, dto.nit || null, dto.phone, dto.email, dto.website || null]
    )
    businessId = ins.insertId
  }

  res.json({ ok: true, businessId })
})

/* -------------------------------------------------------
   CAMBIO DE PLAN (separado) — flujo con init → pago → confirm
------------------------------------------------------- */

// POST /api/business/me/change-plan/init → crea borrador pendiente de pago
r.post('/me/change-plan/init', async (req, res) => {
  const uid = req.user.id
  const dto = z.object({
    plan: z.enum(['citas','contable','mixto'])
  }).parse(req.body)

  const [[biz]] = await pool.query(
    'SELECT id FROM businesses WHERE owner_user_id=? LIMIT 1', [uid]
  )
  if (!biz) return res.status(400).json({ error:'Primero crea tu negocio' })

  const [[plan]] = await pool.query(
    'SELECT id, code, name, price_yr FROM plans WHERE code=? LIMIT 1', [dto.plan]
  )
  if (!plan) return res.status(400).json({ error:'Plan inválido' })

  // Creamos una suscripción "borrador" sin afectar la activa
  const [ins] = await pool.query(
    `INSERT INTO subscriptions (business_id, plan_id, started_at, ends_at, status)
     VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'pending_payment')`,
    [biz.id, plan.id]
  )

  res.json({
    ok: true,
    draftSubscriptionId: ins.insertId,
    plan: { id: plan.id, code: plan.code, name: plan.name, price_yr: plan.price_yr }
  })
})

// POST /api/business/me/change-plan/confirm → activa borrador y cancela la activa previa
r.post('/me/change-plan/confirm', async (req, res) => {
  const uid = req.user.id
  const dto = z.object({
    draftId: z.number().int().positive(),
    paymentRef: z.string().min(3) // id o referencia del pago externo (Stripe/MercadoPago)
  }).parse(req.body)

  const [[biz]] = await pool.query(
    'SELECT id FROM businesses WHERE owner_user_id=? LIMIT 1', [uid]
  )
  if (!biz) return res.status(400).json({ error:'Primero crea tu negocio' })

  const [[draft]] = await pool.query(
    'SELECT * FROM subscriptions WHERE id=? AND business_id=? LIMIT 1',
    [dto.draftId, biz.id]
  )
  if (!draft) return res.status(404).json({ error:'Borrador no encontrado' })
  if (draft.status !== 'pending_payment') {
    return res.status(400).json({ error:'El borrador no está pendiente de pago' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Cancela la suscripción activa anterior (si existe)
    await conn.query(
      'UPDATE subscriptions SET status="canceled" WHERE business_id=? AND status="active"',
      [biz.id]
    )

    // Activa el borrador y guarda referencia de pago (si existe la columna)
    // Nota: si tu tabla no tiene external_payment_id, quita ese campo del UPDATE.
    await conn.query(
      `UPDATE subscriptions
       SET status="active", external_payment_id=?
       WHERE id=?`,
       [dto.paymentRef, draft.id]
    )

    await conn.commit()
    res.json({ ok: true, activatedSubscriptionId: draft.id })
  } catch (e) {
    await conn.rollback()
    res.status(500).json({ error: e.message })
  } finally {
    conn.release()
  }
})

/* -------------------------------------------------------
   PREFERENCIAS / HORARIOS
------------------------------------------------------- */

// PUT /api/business/me/schedule  → guarda prefs (horario/intervalo/delivery)
r.put('/me/schedule', async (req, res) => {
  const uid = req.user.id
  const dto = z.object({
    startHour: z.number().min(0).max(23),
    endHour:   z.number().min(0).max(23),
    slotMin:   z.number().min(5).max(240),
    delivery:  z.boolean()
  }).parse(req.body)

  const [[biz]] = await pool.query(
    'SELECT id FROM businesses WHERE owner_user_id=? LIMIT 1', [uid]
  )
  if (!biz) return res.status(400).json({ error:'Primero crea tu negocio' })

  await pool.query(
    `INSERT INTO business_prefs (business_id,start_hour,end_hour,slot_min,delivery)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE start_hour=VALUES(start_hour), end_hour=VALUES(end_hour),
       slot_min=VALUES(slot_min), delivery=VALUES(delivery)`,
    [biz.id, dto.startHour, dto.endHour, dto.slotMin, dto.delivery ? 1 : 0]
  )
  res.json({ ok: true })
})

// PUT /api/business/me/hours  -> guarda horario semanal completo
r.put('/me/hours', async (req, res) => {
  const uid = req.user.id
  const dtoSchema = z.object({
    hours: z.array(z.object({
      dow: z.number().min(0).max(6),
      is_open: z.boolean(),
      start_min: z.number().nullable().optional(),
      end_min:   z.number().nullable().optional(),
      slot_min:  z.number().nullable().optional()
    })).min(1).max(7)
  })
  const dto = dtoSchema.parse(req.body)

  const [[biz]] = await pool.query('SELECT id FROM businesses WHERE owner_user_id=? LIMIT 1', [uid])
  if (!biz) return res.status(400).json({ error:'Primero crea tu negocio' })

  // Upsert por día
  const sql = `
    INSERT INTO business_hours (business_id,dow,is_open,start_min,end_min,slot_min)
    VALUES (?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      is_open=VALUES(is_open),
      start_min=VALUES(start_min),
      end_min=VALUES(end_min),
      slot_min=VALUES(slot_min)
  `
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (const d of dto.hours) {
      await conn.query(sql, [
        biz.id,
        d.dow,
        d.is_open ? 1 : 0,
        d.start_min ?? null,
        d.end_min ?? null,
        d.slot_min ?? null
      ])
    }
    await conn.commit()
    res.json({ ok: true })
  } catch (e) {
    await conn.rollback()
    res.status(500).json({ error: e.message })
  } finally {
    conn.release()
  }
})

export default r
