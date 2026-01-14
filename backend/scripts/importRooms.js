import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import connectDB from '../config/mongodb.js'
import Room from '../models/roomModel.js'
import Resort from '../models/resortModel.js'
import CottageType from '../models/cottageTypeModel.js'

const filePath = path.resolve(process.cwd(), '..', 'admin', 'src', 'components', 'rooms', 'allrooms.json')

async function importRooms() {
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
  for (const it of items) {
    try {
      // find or create resort
      let resortDoc = null
      if (it.resort) {
        resortDoc = await Resort.findOne({ resortName: it.resort })
        if (!resortDoc) {
          resortDoc = new Resort({ resortName: it.resort })
          await resortDoc.save()
          console.log(`Created resort record for "${it.resort}"`)
        }
      }

      // find or create cottage type
      let ctDoc = null
      if (it.cottageType) {
        ctDoc = await CottageType.findOne({ name: it.cottageType, resort: resortDoc ? resortDoc._id : undefined })
        if (!ctDoc) {
          // basePrice fallback to weekdayRate or weekendRate
          const basePrice = it.weekdayRate || it.weekendRate || 0
          const ctPayload = { name: it.cottageType, basePrice }
          if (resortDoc) ctPayload.resort = resortDoc._id
          ctDoc = new CottageType(ctPayload)
          await ctDoc.save()
          console.log(`Created cottageType record for "${it.cottageType}"`)
        }
      }

      const roomNumber = it.roomId || it.id || it.roomName || `r-${Date.now()}`
      const price = it.weekdayRate ? Number(it.weekdayRate) : (it.weekendRate ? Number(it.weekendRate) : undefined)

      // normalize images: allow string or array
      let images = []
      if (it.roomImage) {
        if (Array.isArray(it.roomImage)) images = it.roomImage.map((u) => ({ url: u }))
        else if (typeof it.roomImage === 'string') images = [{ url: it.roomImage }]
      }

      const roomData = {
        roomNumber,
        roomId: it.roomId,
        roomName: it.roomName,
        price,
        weekdayRate: it.weekdayRate ? Number(it.weekdayRate) : undefined,
        weekendRate: it.weekendRate ? Number(it.weekendRate) : undefined,
        guests: it.guests ? Number(it.guests) : undefined,
        extraGuests: it.extraGuests ? Number(it.extraGuests) : undefined,
        bedChargeWeekday: it.bedChargeWeekday ? Number(it.bedChargeWeekday) : undefined,
        bedChargeWeekend: it.bedChargeWeekend ? Number(it.bedChargeWeekend) : undefined,
        images,
        notes: `importedFrom:allrooms.json; sourceId:${it.id || ''}`,
        rawSource: it,
      }

  if (resortDoc) roomData.resort = resortDoc._id
  else roomData.notes += `; resortName:${it.resort || ''}`

  if (ctDoc) roomData.cottageType = ctDoc._id
  else roomData.notes += `; cottageTypeName:${it.cottageType || ''}`

      // Skip duplicates by roomId if present
      if (it.roomId) {
        const exists = await Room.findOne({ roomId: it.roomId })
        if (exists) {
          // update existing document with any new fields instead of skipping
          Object.assign(exists, roomData)
          await exists.save()
          console.log(`Updated existing room with roomId=${it.roomId}`)
          continue
        }
      }

      const room = new Room(roomData)
      await room.save()
      created++
      console.log(`Created room ${room.roomId || room.roomNumber}`)
    } catch (err) {
      console.error('Failed to import item', it && (it.roomId || it.id || it.roomName), err.message || err)
    }
  }

  console.log(`Import finished. Created ${created} rooms.`)
}

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

if (process.argv[1] === __filename) {
  importRooms()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1) })
}

export default importRooms
