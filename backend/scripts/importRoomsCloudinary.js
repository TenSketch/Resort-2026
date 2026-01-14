import 'dotenv/config'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from '../config/mongodb.js'
import cloudinary from '../config/cloudinaryConfig.js'
import Room from '../models/roomModel.js'
import Resort from '../models/resortModel.js'
import CottageType from '../models/cottageTypeModel.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the JSON source file
const jsonPath = path.resolve(process.cwd(), '..', 'admin', 'src', 'components', 'rooms', 'allrooms.json')
// Root folder where local images live (admin/public)
const publicRoot = path.resolve(process.cwd(), '..', 'admin', 'public')

async function ensureResort(name) {
  if (!name) return null
  let doc = await Resort.findOne({ resortName: name })
  if (!doc) {
    doc = new Resort({ resortName: name })
    await doc.save()
    console.log(`Created resort: ${name}`)
  }
  return doc
}

async function ensureCottageType(name, resortDoc, basePrice) {
  if (!name) return null
  const query = { name }
  if (resortDoc) query.resort = resortDoc._id
  let doc = await CottageType.findOne(query)
  if (!doc) {
    doc = new CottageType({ name, basePrice: basePrice || 0, resort: resortDoc?._id })
    await doc.save()
    console.log(`Created cottage type: ${name}`)
  }
  return doc
}

function localImageAbsolute(rel) {
  if (!rel) return null
  if (/^https?:\/\//i.test(rel)) return null // remote URL; we will upload only local paths
  let clean = rel.startsWith('/') ? rel.slice(1) : rel
  const abs = path.join(publicRoot, clean)
  return abs
}

async function uploadIfLocal(imagePath, folder) {
  if (!imagePath) return null
  if (!fsSync.existsSync(imagePath)) return null
  try {
    const res = await cloudinary.uploader.upload(imagePath, { folder })
    return { url: res.secure_url, public_id: res.public_id }
  } catch (e) {
    console.warn('Upload failed for', imagePath, e.message || e)
    return null
  }
}

function needsUpload(roomDoc) {
  if (!roomDoc) return true
  if (!roomDoc.images || !roomDoc.images.length) return true
  // If any existing image url looks like a local path (starts with /img) treat as needing upload
  return roomDoc.images.some(img => typeof img.url === 'string' && img.url.startsWith('/img/'))
}

async function importRoomsWithImages() {
  await connectDB()

  let jsonRaw
  try { jsonRaw = await fs.readFile(jsonPath, 'utf8') } catch (e) { throw new Error('Cannot read JSON file: ' + jsonPath) }

  let items
  try { items = JSON.parse(jsonRaw) } catch (e) { throw new Error('Invalid JSON structure in allrooms.json') }
  if (!Array.isArray(items)) throw new Error('JSON root must be an array')

  let created = 0, updated = 0, skipped = 0, uploadedImages = 0

  for (const it of items) {
    const roomKey = it.roomId || it.id || it.roomName
    try {
      const resortDoc = await ensureResort(it.resort)
      const basePrice = it.weekdayRate || it.weekendRate || 0
      const cottageTypeDoc = await ensureCottageType(it.cottageType, resortDoc, basePrice)

      // Find existing by roomId or fallback by imported source id note
      let existing = null
      if (it.roomId) existing = await Room.findOne({ roomId: it.roomId })
      if (!existing && it.id) existing = await Room.findOne({ 'rawSource.id': it.id })

      const roomNumber = it.roomId || it.id || it.roomName || `room-${Date.now()}`

      const payload = {
        roomNumber,
        roomId: it.roomId,
        roomName: it.roomName,
        price: it.weekdayRate || it.weekendRate || undefined,
        weekdayRate: it.weekdayRate ? Number(it.weekdayRate) : undefined,
        weekendRate: it.weekendRate ? Number(it.weekendRate) : undefined,
        guests: it.guests ? Number(it.guests) : undefined,
        extraGuests: it.extraGuests ? Number(it.extraGuests) : undefined,
        bedChargeWeekday: it.bedChargeWeekday ? Number(it.bedChargeWeekday) : undefined,
        bedChargeWeekend: it.bedChargeWeekend ? Number(it.bedChargeWeekend) : undefined,
        notes: `import:allrooms.json; sourceId:${it.id || ''}`,
        rawSource: it,
      }
      if (resortDoc) payload.resort = resortDoc._id
      if (cottageTypeDoc) payload.cottageType = cottageTypeDoc._id

      if (!existing) {
        existing = new Room(payload)
        await existing.save()
        created++
        console.log('Created room', roomKey)
      } else {
        Object.assign(existing, payload)
      }

      if (needsUpload(existing)) {
        const folder = `vanavihari/rooms/${(it.roomId || it.roomName || 'room').replace(/[^a-z0-9_-]+/gi,'_')}`
        const localAbs = localImageAbsolute(it.roomImage)
        const imageRecords = []
        if (localAbs) {
          const uploaded = await uploadIfLocal(localAbs, folder)
          if (uploaded) { imageRecords.push(uploaded); uploadedImages++ }
        }
        // If no image uploaded keep previous images if any
        if (imageRecords.length) existing.images = imageRecords
      }

      await existing.save()
      if (existing.isModified()) updated++

    } catch (e) {
      console.error('Failed processing room', roomKey, e.message || e)
      skipped++
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Uploaded Images: ${uploadedImages}`)
}

if (process.argv[1] === __filename) {
  importRoomsWithImages()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
}

export default importRoomsWithImages
