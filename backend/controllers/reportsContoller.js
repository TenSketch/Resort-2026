import Reservation from '../models/reservationModel.js'
import Resort from '../models/resortModel.js'
import Room from '../models/roomModel.js'
import mongoose from 'mongoose'

// Get daily occupancy report for a specific resort
export const getDailyOccupancyReport = async (req, res) => {
  try {
    const { resortId } = req.params
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all rooms for this resort
    const rooms = await Room.find({ resort: resortId }).lean()
    
    // Get all active reservations for today (checkIn <= today < checkOut)
    const reservations = await Reservation.find({
      resort: resortId,
      status: 'reserved',
      checkIn: { $lte: tomorrow },
      checkOut: { $gt: today }
    }).lean()

    // Create a map of room occupancy
    const roomOccupancyMap = new Map()
    
    reservations.forEach(reservation => {
      if (reservation.rooms && Array.isArray(reservation.rooms)) {
        reservation.rooms.forEach(roomId => {
          // Calculate remaining days
          const checkOutDate = new Date(reservation.checkOut)
          const diffTime = checkOutDate.getTime() - today.getTime()
          const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          // Calculate number of days
          const checkInDate = new Date(reservation.checkIn)
          const totalDiffTime = checkOutDate.getTime() - checkInDate.getTime()
          const noOfDays = Math.ceil(totalDiffTime / (1000 * 60 * 60 * 24))
          
          roomOccupancyMap.set(roomId, {
            bookingId: reservation.bookingId,
            guestName: reservation.fullName,
            paidAmount: reservation.totalPayable,
            guests: reservation.guests || 0,
            extraGuests: reservation.extraGuests || 0,
            children: reservation.children || 0,
            totalGuests: (reservation.guests || 0) + (reservation.extraGuests || 0) + (reservation.children || 0),
            totalFoods: (reservation.guests || 0) + (reservation.extraGuests || 0) + (reservation.children || 0),
            noOfDays,
            remainingDays: Math.max(0, remainingDays)
          })
        })
      }
    })

    // Build report data
    const reportData = rooms.map(room => {
      const roomId = room._id.toString()
      const occupancy = roomOccupancyMap.get(roomId)
      
      if (occupancy) {
        return {
          roomName: room.roomName || room.roomId || room.roomNumber || 'Unknown',
          ...occupancy
        }
      } else {
        return {
          roomName: room.roomName || room.roomId || room.roomNumber || 'Unknown',
          status: 'Available'
        }
      }
    })

    res.json({ success: true, data: reportData })
  } catch (err) {
    console.error('getDailyOccupancyReport error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get daily occupancy report by resort slug
export const getDailyOccupancyReportBySlug = async (req, res) => {
  try {
    const { slug } = req.params
    
    // Find resort by slug
    const resort = await Resort.findOne({ slug }).lean()
    if (!resort) {
      return res.status(404).json({ success: false, error: 'Resort not found' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all rooms for this resort
    const rooms = await Room.find({ resort: resort._id }).lean()
    
    // Get all active reservations for today
    const reservations = await Reservation.find({
      resort: resort._id.toString(),
      status: 'reserved',
      checkIn: { $lte: tomorrow },
      checkOut: { $gt: today }
    }).lean()

    // Create a map of room occupancy
    const roomOccupancyMap = new Map()
    
    reservations.forEach(reservation => {
      if (reservation.rooms && Array.isArray(reservation.rooms)) {
        reservation.rooms.forEach(roomId => {
          const checkOutDate = new Date(reservation.checkOut)
          const diffTime = checkOutDate.getTime() - today.getTime()
          const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          const checkInDate = new Date(reservation.checkIn)
          const totalDiffTime = checkOutDate.getTime() - checkInDate.getTime()
          const noOfDays = Math.ceil(totalDiffTime / (1000 * 60 * 60 * 24))
          
          roomOccupancyMap.set(roomId, {
            bookingId: reservation.bookingId,
            guestName: reservation.fullName,
            paidAmount: reservation.totalPayable,
            guests: reservation.guests || 0,
            extraGuests: reservation.extraGuests || 0,
            children: reservation.children || 0,
            totalGuests: (reservation.guests || 0) + (reservation.extraGuests || 0) + (reservation.children || 0),
            totalFoods: (reservation.guests || 0) + (reservation.extraGuests || 0) + (reservation.children || 0),
            noOfDays,
            remainingDays: Math.max(0, remainingDays)
          })
        })
      }
    })

    // Build report data
    const reportData = rooms.map(room => {
      const roomId = room._id.toString()
      const occupancy = roomOccupancyMap.get(roomId)
      
      if (occupancy) {
        return {
          roomName: room.roomName || room.roomId || room.roomNumber || 'Unknown',
          ...occupancy
        }
      } else {
        return {
          roomName: room.roomName || room.roomId || room.roomNumber || 'Unknown',
          status: 'Available'
        }
      }
    })

    res.json({ success: true, data: reportData, resortName: resort.resortName })
  } catch (err) {
    console.error('getDailyOccupancyReportBySlug error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}


// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { resortId } = req.query
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Build query filter
    const resortFilter = resortId ? { resort: resortId } : {}

    // Get all resorts
    const resorts = await Resort.find().lean()
    
    // Total bookings today (reservations created today)
    const totalBookingsToday = await Reservation.countDocuments({
      ...resortFilter,
      createdAt: { $gte: today, $lt: tomorrow }
    })

    // Total guests today (currently checked in)
    const activeReservations = await Reservation.find({
      ...resortFilter,
      status: 'reserved',
      checkIn: { $lte: tomorrow },
      checkOut: { $gt: today }
    }).lean()

    const totalGuestsToday = activeReservations.reduce((sum, r) => 
      sum + (r.guests || 0) + (r.extraGuests || 0) + (r.children || 0), 0
    )

    // Expected checkouts today
    const expectedCheckouts = await Reservation.countDocuments({
      ...resortFilter,
      status: 'reserved',
      checkOut: { $gte: today, $lt: tomorrow }
    })

    // Vacant rooms calculation
    const allRooms = await Room.find({ ...resortFilter, status: 'available' }).lean()
    const occupiedRoomIds = new Set()
    activeReservations.forEach(r => {
      if (r.rooms && Array.isArray(r.rooms)) {
        r.rooms.forEach(roomId => occupiedRoomIds.add(roomId))
      }
    })
    const vacantRooms = allRooms.length - occupiedRoomIds.size

    // Payment breakdown (last 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentReservations = await Reservation.find({
      ...resortFilter,
      createdAt: { $gte: thirtyDaysAgo }
    }).lean()

    const paymentStats = recentReservations.reduce((acc, r) => {
      acc[r.paymentStatus] = (acc[r.paymentStatus] || 0) + 1
      return acc
    }, {})

    const totalPayments = recentReservations.length || 1
    const paymentBreakdown = [
      { name: 'Paid', value: Math.round(((paymentStats.paid || 0) / totalPayments) * 100) },
      { name: 'Pending', value: Math.round(((paymentStats.pending || 0) / totalPayments) * 100) },
      { name: 'Unpaid', value: Math.round(((paymentStats.unpaid || 0) / totalPayments) * 100) },
      { name: 'Failed', value: Math.round(((paymentStats.failed || 0) / totalPayments) * 100) },
      { name: 'Refunded', value: Math.round(((paymentStats.refunded || 0) / totalPayments) * 100) }
    ].filter(item => item.value > 0)

    // Last 5 bookings
    const last5Bookings = await Reservation.find(resortFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    const last5BookingsFormatted = await Promise.all(
      last5Bookings.map(async (booking) => {
        let resortName = 'Unknown'
        let roomName = 'Unknown'

        if (booking.resort && mongoose.Types.ObjectId.isValid(booking.resort)) {
          const resort = await Resort.findById(booking.resort).select('resortName').lean()
          if (resort) resortName = resort.resortName
        }

        if (booking.rooms && booking.rooms.length > 0) {
          const firstRoomId = booking.rooms[0]
          if (mongoose.Types.ObjectId.isValid(firstRoomId)) {
            const room = await Room.findById(firstRoomId).select('roomName roomId roomNumber').lean()
            if (room) roomName = room.roomName || room.roomId || room.roomNumber || 'Unknown'
          }
        }

        return {
          id: booking.bookingId || booking._id.toString().slice(-6),
          guest: booking.fullName || 'Guest',
          resort: resortName,
          room: roomName,
          status: booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'pending' ? 'Pending' : 'Unpaid',
          amount: booking.totalPayable || 0
        }
      })
    )

    // 7-day occupancy forecast
    const occupancy7Day = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const reservationsOnDate = await Reservation.countDocuments({
        ...resortFilter,
        status: 'reserved',
        checkIn: { $lte: nextDate },
        checkOut: { $gt: date }
      })

      const occupancyRate = allRooms.length > 0 
        ? Math.round((reservationsOnDate / allRooms.length) * 100)
        : 0

      occupancy7Day.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        occupancy: occupancyRate
      })
    }

    // Resort-specific vacant rooms
    const resortVacantRooms = {}
    for (const resort of resorts) {
      const resortRooms = await Room.find({ resort: resort._id, status: 'available' }).lean()
      const resortActiveReservations = await Reservation.find({
        resort: resort._id.toString(),
        status: 'reserved',
        checkIn: { $lte: tomorrow },
        checkOut: { $gt: today }
      }).lean()

      const resortOccupiedRoomIds = new Set()
      resortActiveReservations.forEach(r => {
        if (r.rooms && Array.isArray(r.rooms)) {
          r.rooms.forEach(roomId => resortOccupiedRoomIds.add(roomId))
        }
      })

      resortVacantRooms[resort._id.toString()] = resortRooms.length - resortOccupiedRoomIds.size
    }

    res.json({
      success: true,
      stats: {
        totalBookingsToday,
        vacantRooms,
        totalGuestsToday,
        expectedCheckouts
      },
      paymentBreakdown,
      last5Bookings: last5BookingsFormatted,
      occupancy7Day,
      resorts: resorts.map(r => ({
        id: r._id.toString(),
        name: r.resortName,
        vacantToday: resortVacantRooms[r._id.toString()] || 0
      }))
    })
  } catch (err) {
    console.error('getDashboardStats error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
