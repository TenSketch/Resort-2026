import fs from 'fs'
import path from 'path'
import connectDB from '../config/mongodb.js'
import Log from '../models/logModel.js'

const run = async () => {
  try {
    // allow passing URI as first arg: node importLogs.js "mongodb://..."
    const maybeUri = process.argv[2]
    if (maybeUri) process.env.MONGODB_URI = maybeUri

    if (!process.env.MONGODB_URI) {
      console.error('Please set MONGODB_URI environment variable or pass it as first argument')
      process.exit(1)
    }

    await connectDB()

    const jsonPath = path.resolve(process.cwd(), '..', 'admin', 'src', 'components', 'logReports', 'logs.json')
    // Support running from backend folder as well
    const altPath = path.resolve(process.cwd(), 'admin', 'src', 'components', 'logReports', 'logs.json')

    let filePath = jsonPath
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(altPath)) filePath = altPath
      else {
        // fallback to explicit project-relative path
        filePath = path.resolve(process.cwd(), '..', '..', 'admin', 'src', 'components', 'logReports', 'logs.json')
      }
    }

    if (!fs.existsSync(filePath)) {
      console.error('logs.json not found at expected locations:')
      console.error(jsonPath)
      console.error(altPath)
      process.exit(1)
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const items = JSON.parse(raw)

    if (!Array.isArray(items)) {
      console.error('logs.json should be an array of log entries')
      process.exit(1)
    }

    let inserted = 0
    for (const it of items) {
      const doc = { ...it }
      if (doc.logEntryDate) {
        // accept ISO-like strings
        const d = new Date(doc.logEntryDate)
        if (!isNaN(d)) doc.logEntryDate = d
      }
      // save
      try {
        const exists = await Log.findOne({ bookingId: doc.bookingId, username: doc.username, logMessage: doc.logMessage }).lean()
        if (exists) continue
        const l = new Log(doc)
        await l.save()
        inserted++
      } catch (e) {
        console.error('error saving item', doc, e.message)
      }
    }

    console.log(`Inserted ${inserted} logs`)
    process.exit(0)
  } catch (err) {
    console.error('importLogs failed', err)
    process.exit(1)
  }
}

run()
