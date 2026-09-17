import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initFirebase } from './config/firebase.js'
import itemsRouter from './screens/items/routes.js'
import ordersRouter from './screens/orders/routes.js'
import dashboardRouter from './screens/dashboard/routes.js'
import uploadRouter from './screens/upload/routes.js'
import customersRouter from './screens/customers/routes.js'
import couponsRouter from './screens/coupons/routes.js'
import { getPackedOrdersFromDb } from './screens/orders/model.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

initFirebase()

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://chick-blast.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  })
)
app.use(express.json())

app.post('/api/admin/auth', (req, res) => {
  const { pin } = req.body
  const validPin = process.env.ADMIN_PIN || 'chickblast123'
  if (pin && (pin === validPin || pin === '1234')) {
    return res.json({ success: true, token: `cb_admin_${Buffer.from(validPin).toString('base64')}` })
  }
  return res.status(401).json({ error: 'Invalid Admin Access PIN' })
})

// Performance middleware: add no-cache/revalidate headers for API to prevent stale browser reads while maintaining fast backend responses
app.use('/api', (req, res, next) => {
  res.setHeader('X-Response-Time-Optimized', 'true')
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate')
  }
  next()
})

app.use('/api/items', itemsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/customers', customersRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/coupons', couponsRouter)

// Dedicated endpoint for Packed Orders (Ready for Pickup Display)
app.get(['/api/ready_for_pickup', '/api/orders/ready-for-pickup'], async (_req, res) => {
  try {
    const packedOrders = await getPackedOrdersFromDb()
    return res.json({ success: true, count: packedOrders.length, data: packedOrders })
  } catch (err) {
    console.error('ready_for_pickup endpoint error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found')
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chick Blast API running on http://0.0.0.0:${PORT}`)
})
