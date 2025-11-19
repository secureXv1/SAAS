import express from 'express'
import { pool } from '../db.js'
import { auth, requireRole } from '../middlewares.js'

const router = express.Router()

// Helper: valida rango y negocio
function ensureBusiness(req) {
  const businessId = Number(req.user?.business_id || req.query.business_id)
  if (!businessId) throw new Error('Missing business_id')
  return businessId
}

// ---- LISTAR Citas + filtros (rango obligatorio)
router.get('/business/appointments', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const { from, to, q, client_id, is_domicile, status } = req.query

    if (!from || !to) return res.status(400).json({ error: 'from/to required' })

    const where = ['a.business_id = ?']
    const params = [businessId]

    where.push('a.start_at < ? AND a.end_at > ?')
    params.push(to, from)

    if (client_id) { where.push('a.client_id = ?'); params.push(Number(client_id)) }
    if (status)    { where.push('a.status = ?'); params.push(String(status)) }
    if (is_domicile === '1' || is_domicile === '0') { where.push('a.is_domicile = ?'); params.push(Number(is_domicile)) }
    if (q) {
      where.push('(a.title LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)')
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    const sql = `
      SELECT a.*, c.full_name AS client_name, c.phone AS client_phone, c.address AS client_address
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.start_at ASC
    `
    const [rows] = await pool.query(sql, params)
    res.json({ items: rows })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// ---- CREAR cita (valida bloqueos y solape)
router.post('/business/appointments', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const userId = req.user.id
    const {
      client_id, title, notes, is_domicile, domicile_addr, domicile_phone,
      start_at, end_at
    } = req.body

    if (!client_id || !title || !start_at || !end_at)
      return res.status(400).json({ error: 'client_id, title, start_at, end_at required' })

    // Validar cliente visible
    const [okClient] = await pool.query(`
      SELECT 1 FROM clients c
      LEFT JOIN business_clients bc ON bc.client_id = c.id AND bc.business_id = ?
      WHERE c.id = ? AND (c.owner_user_id = ? OR bc.id IS NOT NULL)
      LIMIT 1`, [businessId, client_id, userId])
    if (!okClient.length) return res.status(403).json({ error: 'Cliente no autorizado' })

    // Validar solapes
    const overlapSQL = `
      SELECT 'APPT' FROM appointments WHERE business_id=? AND start_at < ? AND end_at > ?
      UNION ALL
      SELECT 'BLOCK' FROM appointment_blocks WHERE business_id=? AND start_at < ? AND end_at > ?`
    const [over] = await pool.query(overlapSQL, [businessId, end_at, start_at, businessId, end_at, start_at])
    if (over.length) return res.status(409).json({ error: 'Horario no disponible' })

    // Insertar
    const [ins] = await pool.query(`
      INSERT INTO appointments (business_id, owner_user_id, client_id, title, notes, is_domicile, domicile_addr, domicile_phone, start_at, end_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [businessId, userId, client_id, title, notes || null, is_domicile ? 1 : 0, domicile_addr || null, domicile_phone || null, start_at, end_at]
    )
    const [row] = await pool.query('SELECT * FROM appointments WHERE id=?', [ins.insertId])
    res.status(201).json(row[0])
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// ---- ACTUALIZAR cita
router.patch('/business/appointments/:id', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const { id } = req.params
    const {
      client_id, title, notes, is_domicile, domicile_addr, domicile_phone,
      start_at, end_at, status
    } = req.body

    const [exists] = await pool.query('SELECT * FROM appointments WHERE id=? AND business_id=?', [id, businessId])
    if (!exists.length) return res.status(404).json({ error: 'No encontrada' })

    if (start_at && end_at) {
      const [over] = await pool.query(`
        SELECT 'APPT' FROM appointments WHERE business_id=? AND id<>? AND start_at < ? AND end_at > ?
        UNION ALL
        SELECT 'BLOCK' FROM appointment_blocks WHERE business_id=? AND start_at < ? AND end_at > ?`,
        [businessId, id, end_at, start_at, businessId, end_at, start_at])
      if (over.length) return res.status(409).json({ error: 'Horario no disponible' })
    }

    const fields = []
    const params = []
    const setIf = (col, val) => { fields.push(`${col}=?`); params.push(val) }

    if (client_id !== undefined) setIf('client_id', client_id)
    if (title !== undefined) setIf('title', title)
    if (notes !== undefined) setIf('notes', notes)
    if (is_domicile !== undefined) setIf('is_domicile', is_domicile ? 1 : 0)
    if (domicile_addr !== undefined) setIf('domicile_addr', domicile_addr)
    if (domicile_phone !== undefined) setIf('domicile_phone', domicile_phone)
    if (start_at !== undefined) setIf('start_at', start_at)
    if (end_at !== undefined) setIf('end_at', end_at)
    if (status !== undefined) setIf('status', status)

    if (!fields.length) return res.json(exists[0])

    params.push(id, businessId)
    const sql = `UPDATE appointments SET ${fields.join(', ')} WHERE id=? AND business_id=?`
    await pool.query(sql, params)

    const [row] = await pool.query('SELECT * FROM appointments WHERE id=?', [id])
    res.json(row[0])
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// ---- ELIMINAR cita
router.delete('/business/appointments/:id', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const { id } = req.params
    const [del] = await pool.query('DELETE FROM appointments WHERE id=? AND business_id=?', [id, businessId])
    if (!del.affectedRows) return res.status(404).json({ error: 'No encontrada' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// ---- LISTAR Bloqueos
router.get('/business/appointment-blocks', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const { from, to } = req.query
    if (!from || !to) return res.status(400).json({ error: 'from/to required' })

    const [rows] = await pool.query(`
      SELECT * FROM appointment_blocks
      WHERE business_id=? AND start_at < ? AND end_at > ?
      ORDER BY start_at ASC`, [businessId, to, from])
    res.json({ items: rows })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// ---- CREAR Bloqueo
router.post('/business/appointment-blocks', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const userId = req.user.id
    const { reason, start_at, end_at } = req.body

    // Solo fechas obligatorias; el motivo es opcional
    if (!start_at || !end_at) {
      return res.status(400).json({ error: 'start_at, end_at required' })
    }

    const cleanReason = (reason ?? '').trim()

    const [over] = await pool.query(
      `SELECT 'APPT' FROM appointments
       WHERE business_id=? AND start_at < ? AND end_at > ?`,
      [businessId, end_at, start_at]
    )
    if (over.length) {
      return res.status(409).json({ error: 'Conflicto con citas existentes' })
    }

    const [ins] = await pool.query(
      `INSERT INTO appointment_blocks (business_id, owner_user_id, reason, start_at, end_at)
       VALUES (?,?,?,?,?)`,
      [businessId, userId, cleanReason, start_at, end_at]
    )

    const [row] = await pool.query('SELECT * FROM appointment_blocks WHERE id=?', [ins.insertId])
    res.status(201).json(row[0])
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})



// ---- ELIMINAR Bloqueo
router.delete('/business/appointment-blocks/:id', auth, requireRole('business'), async (req, res) => {
  try {
    const businessId = ensureBusiness(req)
    const { id } = req.params
    const [del] = await pool.query('DELETE FROM appointment_blocks WHERE id=? AND business_id=?', [id, businessId])
    if (!del.affectedRows) return res.status(404).json({ error: 'No encontrado' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

export default router
