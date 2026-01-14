import Room from '../models/roomModel.js'
import Resort from '../models/resortModel.js'
import Reservation from '../models/reservationModel.js'
import mongoose from 'mongoose'
import cloudinary from '../config/cloudinaryConfig.js'
import fs from 'fs'
import { promisify } from 'util'
const unlinkAsync = promisify(fs.unlink)

const createRoom = async (req, res) => {
  try {
    const body = req.body || {}
    const v = (key) => {
      const val = body[key]
      if (Array.isArray(val)) return val[0]
      return val
    }

    // Generate roomId if not provided
    let roomId = v('roomId')
    let roomNumber = v('roomNumber')
    const resortId = v('resort')

    if (!roomId && resortId) {
      // Fetch resort to get prefix
      const resort = await Resort.findById(resortId)
      if (resort && resort.roomIdPrefix) {
        const prefix = resort.roomIdPrefix
        // Find the last room with this prefix
        const lastRoom = await Room.findOne({ 
          roomId: new RegExp(`^${prefix}\\d+$`) 
        }).sort({ createdAt: -1 })
        
        let nextNumber = 1
        if (lastRoom && lastRoom.roomId) {
          const match = lastRoom.roomId.match(/\d+$/)
          if (match) {
            nextNumber = parseInt(match[0]) + 1
          }
        }
        roomId = `${prefix}${nextNumber}`
      }
    }

    // Use roomId as roomNumber if roomNumber not provided
    if (!roomNumber && roomId) {
      roomNumber = roomId
    }

    const roomData = {
      roomNumber: roomNumber,
      roomId: roomId,
      roomName: v('roomName'),
      status: v('status') || undefined,
      price: v('price') ? Number(v('price')) : undefined,
      weekdayRate: v('weekdayRate') ? Number(v('weekdayRate')) : undefined,
      weekendRate: v('weekendRate') ? Number(v('weekendRate')) : undefined,
      guests: v('guests') ? Number(v('guests')) : (v('noOfGuests') ? Number(v('noOfGuests')) : undefined),
      extraGuests: v('extraGuests') ? Number(v('extraGuests')) : undefined,
      children: v('children') ? Number(v('children')) : (v('noOfChildren') ? Number(v('noOfChildren')) : undefined),
      bedChargeWeekday: v('bedChargeWeekday') ? Number(v('bedChargeWeekday')) : (v('chargesPerBedWeekDays') ? Number(v('chargesPerBedWeekDays')) : undefined),
      bedChargeWeekend: v('bedChargeWeekend') ? Number(v('bedChargeWeekend')) : (v('chargesPerBedWeekEnd') ? Number(v('chargesPerBedWeekEnd')) : undefined),
      resort: resortId || undefined,
      cottageType: v('cottageType') || undefined,
      amenities: body.amenities ? (Array.isArray(body.amenities) ? body.amenities : [body.amenities]) : [],
      notes: v('notes'),
    }

    const images = []
    if (req.files && req.files.length) {
      for (const file of req.files) {
        try {
          // Upload from buffer (memory storage) or file path (disk storage)
          let result
          if (file.buffer) {
            // Memory storage - upload from buffer
            result = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'vanavihari/rooms' },
                (error, result) => {
                  if (error) reject(error)
                  else resolve(result)
                }
              )
              uploadStream.end(file.buffer)
            })
          } else if (file.path) {
            // Disk storage - upload from file path
            result = await cloudinary.uploader.upload(file.path, { folder: 'vanavihari/rooms' })
          }
          
          if (result) {
            images.push({ url: result.secure_url, public_id: result.public_id })
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
        } finally {
          // Clean up disk file if it exists
          if (file && file.path) {
            try { await unlinkAsync(file.path) } catch (e) { console.warn('cleanup failed', e.message || e) }
          }
        }
      }
    }

    if (images.length) roomData.images = images

    const room = new Room(roomData)
    await room.save()
    res.status(201).json({ room })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

const listRooms = async (req, res) => {
  try {
    const { resortSlug } = req.query
    
    let query = {}
    
    // Check if this is an admin request (has req.admin from adminAuth middleware)
    // Admin routes can see all rooms, public routes exclude disabled rooms
    if (!req.admin) {
      query.status = { $ne: 'disabled' }
    }
    
    // If resortSlug is provided, filter by resort
    if (resortSlug) {
      const resort = await Resort.findOne({ slug: resortSlug })
      if (!resort) {
        return res.status(404).json({ error: 'Resort not found' })
      }
      query.resort = resort._id
    }
    
    const rooms = await Room.find(query).sort({ createdAt: -1 }).populate('resort').populate('cottageType')
    res.json({ rooms })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// List available rooms based on resort, checkin and checkout dates
const listAvailableRooms = async (req, res) => {
  try {
    const { resortSlug, checkin, checkout } = req.query
    
    if (!resortSlug) {
      return res.status(400).json({ error: 'Resort slug is required' })
    }
    
    // Find the resort
    const resort = await Resort.findOne({ slug: resortSlug })
    if (!resort) {
      return res.status(404).json({ error: 'Resort not found' })
    }
    
    // Get all rooms for this resort (exclude disabled rooms)
    const allRooms = await Room.find({ 
      resort: resort._id,
      status: { $ne: 'disabled' } // Exclude disabled rooms
    })
      .sort({ createdAt: -1 })
      .populate('resort')
      .populate('cottageType')
    
    // If no dates provided, return all rooms but mark them as not bookable
    if (!checkin || !checkout) {
      const roomsWithAvailability = allRooms.map(room => ({
        ...room.toObject(),
        isAvailable: false,
        canBook: false,
        message: 'Please select check-in and check-out dates'
      }))
      return res.json({ rooms: roomsWithAvailability, allRooms: true })
    }
    
    // Parse dates - set time to start of day for accurate comparison
    const checkInDate = new Date(checkin)
    checkInDate.setHours(0, 0, 0, 0)
    const checkOutDate = new Date(checkout)
    checkOutDate.setHours(0, 0, 0, 0)
    
    // Validate dates
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' })
    }
    
    // Find all reservations that overlap with the requested dates
    // A reservation overlaps if the date ranges intersect
    // Two date ranges [A1, A2] and [B1, B2] overlap if: A1 < B2 AND A2 > B1
    // Only consider reservations with status: pending, reserved, or confirmed
    // Exclude: cancelled and not-reserved (these rooms should be available)
    const overlappingReservations = await Reservation.find({
      $or: [
        { resort: resort._id.toString() }, // Match by resort ObjectId
        { resort: resort.resortName }, // Match by resort name (legacy)
        { resort: resort._id } // Match by resort ObjectId (without toString)
      ],
      status: { $in: ['pending', 'reserved', 'confirmed'] }, // Only these statuses block rooms
      // Date overlap logic: checkIn < our checkOut AND checkOut > our checkIn
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    })
    
    console.log(`Found ${overlappingReservations.length} overlapping reservations (pending/reserved/confirmed) for dates ${checkInDate.toISOString()} to ${checkOutDate.toISOString()}`)
    
    // Build a Set of all reserved room IDs from overlapping reservations
    const reservedRoomIds = new Set()
    overlappingReservations.forEach(reservation => {
      // reservation.rooms is an array of room IDs
      if (Array.isArray(reservation.rooms)) {
        reservation.rooms.forEach(roomId => {
          reservedRoomIds.add(roomId.toString())
        })
      }
    })
    
    console.log(`Reserved room IDs:`, Array.from(reservedRoomIds))
    
    // Filter available rooms - exclude reserved ones
    const availableRooms = allRooms.filter(room => {
      const roomId = room._id.toString()
      const roomIdAlt = room.roomId
      
      // Check if this room is in any overlapping reservation
      const isReserved = reservedRoomIds.has(roomId) || 
                        reservedRoomIds.has(roomIdAlt) ||
                        reservedRoomIds.has(room.roomName)
      
      return !isReserved && room.status === 'available'
    })
    
    // Map rooms with availability info
    const roomsWithAvailability = availableRooms.map(room => ({
      ...room.toObject(),
      isAvailable: true,
      canBook: true
    }))
    
    res.json({ 
      rooms: roomsWithAvailability,
      totalRooms: allRooms.length,
      availableRooms: roomsWithAvailability.length,
      reservedRooms: allRooms.length - roomsWithAvailability.length,
      checkin: checkInDate,
      checkout: checkOutDate
    })
  } catch (error) {
    console.error('Error listing available rooms:', error)
    res.status(500).json({ error: error.message })
  }
}



// Update a room (basic fields + optional new images)
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params
    const body = req.body || {}
    let existing = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      existing = await Room.findById(id)
    }
    // fallback: allow updating by roomId or roomNumber for legacy/static data IDs
    if (!existing) {
      existing = await Room.findOne({ $or: [ { roomId: id }, { roomNumber: id } ] })
    }
    if (!existing) return res.status(404).json({ error: 'Room not found' })

    // Map updatable scalar fields
    const scalarUpdates = ['roomNumber','roomId','roomName','status','price','weekdayRate','weekendRate','guests','extraGuests','children','bedChargeWeekday','bedChargeWeekend','resort','cottageType','notes']
    for (const f of scalarUpdates) {
      if (body[f] !== undefined && body[f] !== null && body[f] !== '') {
        // number coercion for numeric fields
        if (['price','weekdayRate','weekendRate','guests','extraGuests','children','bedChargeWeekday','bedChargeWeekend'].includes(f)) {
          existing[f] = Number(body[f])
        } else {
          existing[f] = body[f]
        }
      }
    }

    // amenities array
    if (body.amenities) {
      existing.amenities = Array.isArray(body.amenities) ? body.amenities : [body.amenities]
    }

    // Handle new images if provided
    if (req.files && req.files.length) {
      const images = []
      for (const file of req.files) {
        try {
          // Upload from buffer (memory storage) or file path (disk storage)
          let result
          if (file.buffer) {
            // Memory storage - upload from buffer
            result = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'vanavihari/rooms' },
                (error, result) => {
                  if (error) reject(error)
                  else resolve(result)
                }
              )
              uploadStream.end(file.buffer)
            })
          } else if (file.path) {
            // Disk storage - upload from file path
            result = await cloudinary.uploader.upload(file.path, { folder: 'vanavihari/rooms' })
          }
          
          if (result) {
            images.push({ url: result.secure_url, public_id: result.public_id })
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
        } finally {
          // Clean up disk file if it exists
          if (file && file.path) {
            try { await unlinkAsync(file.path) } catch (e) { console.warn('cleanup failed', e.message || e) }
          }
        }
      }
      if (images.length) {
        existing.images = [...(existing.images || []), ...images]
      }
    }

    await existing.save()
    res.json({ room: existing })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

// Get next available room ID for a resort
const getNextRoomId = async (req, res) => {
  try {
    const { resortId } = req.params
    
    if (!resortId) {
      return res.status(400).json({ error: 'Resort ID is required' })
    }

    // Fetch resort to get prefix
    const resort = await Resort.findById(resortId)
    if (!resort) {
      return res.status(404).json({ error: 'Resort not found' })
    }

    if (!resort.roomIdPrefix) {
      return res.json({ nextRoomId: '' })
    }

    const prefix = resort.roomIdPrefix
    // Find the last room with this prefix
    const lastRoom = await Room.findOne({ 
      roomId: new RegExp(`^${prefix}\\d+$`),
      resort: resortId
    }).sort({ createdAt: -1 })
    
    let nextNumber = 1
    if (lastRoom && lastRoom.roomId) {
      const match = lastRoom.roomId.match(/\d+$/)
      if (match) {
        nextNumber = parseInt(match[0]) + 1
      }
    }
    
    const nextRoomId = `${prefix}${nextNumber}`
    res.json({ nextRoomId, prefix })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

// Delete a specific image from a room
const deleteRoomImage = async (req, res) => {
  try {
    const { id, publicId } = req.params
    
    if (!publicId) {
      return res.status(400).json({ error: 'Image public_id is required' })
    }

    // Find the room
    let room = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      room = await Room.findById(id)
    }
    if (!room) {
      room = await Room.findOne({ $or: [{ roomId: id }, { roomNumber: id }] })
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    // Find the image in the room's images array
    const imageIndex = room.images.findIndex(img => img.public_id === publicId)
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found in room' })
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError)
      // Continue even if Cloudinary deletion fails
    }

    // Remove from room's images array
    room.images.splice(imageIndex, 1)
    await room.save()

    res.json({ 
      message: 'Image deleted successfully',
      room: room
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export { createRoom, listRooms, listAvailableRooms, updateRoom, getNextRoomId, deleteRoomImage }
