import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: +SMTP_PORT || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  })
}

export async function sendMail({ to, subject, html }) {
  const tx = getTransport()
  if (!tx) {
    console.log('[MAIL:mock]', { to, subject, html })
    return { mock: true }
  }
  return tx.sendMail({ from: process.env.SMTP_USER, to, subject, html })
}
