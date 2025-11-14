import dotenv from 'dotenv'
dotenv.config()
import app from './app.js'
import { ping } from './db.js'
import appointmentsRouter from './routes/appointments.js'
app.use(appointmentsRouter)

const PORT = +process.env.PORT || 4000

ping()
  .then(x => console.log('✅ DB ping:', x))
  .catch(console.error)

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`)
})
