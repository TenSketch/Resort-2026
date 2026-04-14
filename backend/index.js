import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import path from 'path'

import connectDB from './config/mongodb.js'

import userRouter from './routes/userRoutes.js'
import resortRouter from './routes/resortRoutes.js'
import cottageTypeRouter from './routes/cottageTypeRoutes.js'
import roomRouter from './routes/roomRoutes.js'
import amenityRouter from './routes/amenityRoutes.js'
import reservationRouter from './routes/reservationRoutes.js'
import logRouter from './routes/logRoutes.js'
import paymentRouter from './routes/paymentRoutes.js'
import reportsRouter from './routes/reportsRoute.js'

import tentSpotRouter from './routes/tentSpotRoutes.js'
import tentTypeRouter from './routes/tentTypeRoutes.js'
import tentRouter from './routes/tentRoutes.js'
import tentReservationRouter from './routes/tentReservationRoutes.js'
import tentPaymentRouter from './routes/tentPaymentRoutes.js'

import touristSpotRouter from './routes/touristSpotRoutes.js'
import touristSpotReservationRouter from './routes/touristSpotReservationRoutes.js'
import touristPaymentRouter from './routes/touristSpotPaymentRoutes.js'

import webhookRouter from './routes/webhookRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import notificationRouter from './routes/notificationRoutes.js'
import pushRouter from './routes/pushRoutes.js'

import adminAuth from './middlewares/adminAuth.js'
import {
  expirePendingReservations
} from './controllers/reservationController.js'
import {
  expirePendingTentReservations
} from './controllers/tentReservationController.js'

// ---------------- APP CONFIG ----------------
const app = express()
const port = process.env.PORT || 5000

connectDB()

// ---------------- CRON / EXPIRY JOBS ----------------
setInterval(async () => {
  await expirePendingReservations()
  await expirePendingTentReservations()
}, 60000) // every 1 minute

// Run once on startup
expirePendingReservations()
expirePendingTentReservations()

// ---------------- MIDDLEWARE ----------------
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.text({ type: 'text/plain' }))
app.use(cors())

// ---------------- API ROUTES ----------------
app.use('/api/user', userRouter)
app.use('/api/resorts', resortRouter)
app.use('/api/cottage-types', cottageTypeRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/amenities', amenityRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/logs', logRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/reports', reportsRouter)

app.use('/api/tent-spots', tentSpotRouter)
app.use('/api/tent-types', tentTypeRouter)
app.use('/api/tents', tentRouter)
app.use('/api/tent-reservations', tentReservationRouter)
app.use('/api/tent-payment', tentPaymentRouter)

app.use('/api/touristspots', touristSpotRouter)
app.use('/api/trek-reservations', touristSpotReservationRouter)
app.use('/api/trek-payment', touristPaymentRouter)

app.use('/api/webhook', webhookRouter)
app.use('/api/admin', adminRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/push', pushRouter)

// ---------------- STATIC TMP FOLDER ----------------
app.use('/tmp', express.static(path.join(process.cwd(), 'tmp')))

// ---------------- ADMIN TEST ROUTE ----------------
app.get('/api/admin/me', adminAuth, (req, res) => {
  res.json({ admin: req.admin })
})

// ---------------- HEALTH CHECK ----------------
app.get('/', (req, res) => {
  res.send('Vanaavihari API Working 2')
})

// ---------------- START SERVER ----------------
app.listen(port, () => {
  console.log(`Server started on PORT : ${port}`)
})
