import Log from '../models/logModel.js'

export const createLog = async (req, res) => {
  try {
    const payload = { ...req.body }
    if (payload.logEntryDate) payload.logEntryDate = new Date(payload.logEntryDate)
    payload.raw = payload.raw || null

    const log = new Log(payload)
    await log.save()
    res.status(201).json({ success: true, log })
  } catch (err) {
    console.error('createLog error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).lean()
    res.json({ success: true, logs })
  } catch (err) {
    console.error('getLogs error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updateLog = async (req, res) => {
  try {
    const { bookingId } = req.params
    const payload = { ...req.body }
    if (payload.logEntryDate) payload.logEntryDate = new Date(payload.logEntryDate)

    // Try update by bookingId first
    let log = await Log.findOneAndUpdate({ bookingId }, payload, { new: true }).lean()

    // If not found, and bookingId looks like an ObjectId, try _id
    const mongoose = await import('mongoose')
    if (!log && mongoose?.default?.Types?.ObjectId.isValid(bookingId)) {
      log = await Log.findOneAndUpdate({ _id: bookingId }, payload, { new: true }).lean()
    }

    if (!log) return res.status(404).json({ success: false, error: 'Log not found (by bookingId or _id)' })

    res.json({ success: true, log })
  } catch (err) {
    console.error('updateLog error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
