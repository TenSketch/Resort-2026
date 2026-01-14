import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import connectDB from '../config/mongodb.js'
import Reservation from '../models/reservationModel.js'

const filePath = path.resolve(process.cwd(), '..', 'admin', 'src', 'components', 'reservation', 'reservationtable.json')

function toNumber(v) {
  if (v === undefined || v === null || v === '') return undefined
  const s = String(v).replace(/[₹,\s]/g, '')
  const n = Number(s)
  return Number.isNaN(n) ? undefined : n
}

async function importReservations() {
  await connectDB()

  let raw
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch (err) {
    console.error('Failed to read JSON file at', filePath)
    throw err
  }

  let items
  try {
    items = JSON.parse(raw)
  } catch (err) {
    console.error('Failed to parse JSON file', err.message)
    throw err
  }

  let created = 0
  let updated = 0
  for (const it of items) {
    try {
      const payload = { ...it }

      // normalize dates
      if (payload.checkIn) payload.checkIn = new Date(payload.checkIn)
      if (payload.checkOut) payload.checkOut = new Date(payload.checkOut)
      if (payload.reservationDate) payload.reservationDate = new Date(payload.reservationDate)

      // normalize numbers
      payload.guests = toNumber(payload.guests)
      payload.extraGuests = toNumber(payload.extraGuests)
      payload.children = toNumber(payload.children)
      payload.numberOfRooms = toNumber(payload.numberOfRooms)
      payload.refundPercentage = toNumber(payload.refundPercentage)
      payload.roomPrice = toNumber(payload.roomPrice)
      payload.totalPayable = toNumber(payload.totalPayable)

      payload.rawSource = it

      // Upsert: prefer bookingId if available
      let exists = null
      if (payload.bookingId) {
        exists = await Reservation.findOne({ bookingId: payload.bookingId })
      } else if (payload.fullName && payload.reservationDate) {
        // match by fullName + date (date-only)
        const dateOnly = new Date(payload.reservationDate)
        dateOnly.setHours(0,0,0,0)
        const nextDay = new Date(dateOnly)
        nextDay.setDate(nextDay.getDate() + 1)
        exists = await Reservation.findOne({ fullName: payload.fullName, reservationDate: { $gte: dateOnly, $lt: nextDay } })
      }

      if (exists) {
        Object.assign(exists, payload)
        await exists.save()
        updated++
        console.log(`Updated reservation ${exists._id} (${payload.fullName || payload.bookingId || 'no-id'})`)
        continue
      }

      const reservation = new Reservation(payload)
      await reservation.save()
      created++
      console.log(`Created reservation ${reservation._id} (${payload.fullName || payload.bookingId || 'no-id'})`)
    } catch (err) {
      console.error('Failed to import item', (it && (it.bookingId || it.fullName)) || '', err.message || err)
    }
  }

  console.log(`Import finished. Created ${created} reservations, updated ${updated} reservations.`)
}

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

if (process.argv[1] === __filename) {
  importReservations()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1) })
}

export default importReservations
