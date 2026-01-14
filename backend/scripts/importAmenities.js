import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import connectDB from '../config/mongodb.js'
import Amenity from '../models/amenityModel.js'

const filePath = path.resolve(process.cwd(), '..', 'admin', 'src', 'components', 'roomAmenities', 'amenitydata.json')

async function importAmenities() {
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
      const name = it.name && String(it.name).trim()
      if (!name) continue

      // Try to find existing amenity by name (case-insensitive)
      const existing = await Amenity.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })
      if (existing) {
        existing.description = it.description ? String(it.description) : existing.description
        if (typeof it.isActive === 'boolean') existing.isActive = it.isActive
        await existing.save()
        updated++
        console.log(`Updated amenity: ${name}`)
        continue
      }

      const payload = {
        name,
        description: it.description ? String(it.description) : undefined,
        isActive: typeof it.isActive === 'boolean' ? it.isActive : true,
      }

      const doc = new Amenity(payload)
      await doc.save()
      created++
      console.log(`Created amenity: ${name}`)
    } catch (err) {
      console.error('Failed to import amenity', it && it.name, err.message || err)
    }
  }

  console.log(`Import finished. Created ${created}, Updated ${updated} amenities.`)
}

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

if (process.argv[1] === __filename) {
  importAmenities()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1) })
}

export default importAmenities
