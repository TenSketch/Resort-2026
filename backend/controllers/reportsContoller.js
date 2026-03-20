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
      { name: 'paid', value: Math.round(((paymentStats.paid || 0) / totalPayments) * 100) },
      { name: 'pending', value: Math.round(((paymentStats.pending || 0) / totalPayments) * 100) },
      { name: 'unpaid', value: Math.round(((paymentStats.unpaid || 0) / totalPayments) * 100) },
      { name: 'Failed', value: Math.round(((paymentStats.failed || 0) / totalPayments) * 100) },
      { name: 'refunded', value: Math.round(((paymentStats.refunded || 0) / totalPayments) * 100) }
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
          status: booking.paymentStatus === 'paid' ? 'paid' : booking.paymentStatus === 'pending' ? 'pending' : 'unpaid',
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


// Import tent models
import TentReservation from '../models/tentReservationModel.js'
import TentSpot from '../models/tentSpotModel.js'
import Tent from '../models/tentModel.js'

// Import tourist spot models
import TouristSpotReservation from '../models/touristSpotReservationModel.js'
import TouristSpot from '../models/touristSpotModel.js'

// Get tent dashboard statistics
export const getTentDashboardStats = async (req, res) => {
  try {
    const { tentSpotId } = req.query

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Build query filter
    const tentSpotFilter = tentSpotId ? { tentSpot: tentSpotId } : {}

    // Get all tent spots
    const tentSpots = await TentSpot.find().lean()

    // Total bookings today (reservations created today)
    const totalBookingsToday = await TentReservation.countDocuments({
      ...tentSpotFilter,
      createdAt: { $gte: today, $lt: tomorrow }
    })

    // Total guests today (currently checked in)
    const activeReservations = await TentReservation.find({
      ...tentSpotFilter,
      status: 'reserved',
      checkinDate: { $lte: tomorrow },
      checkoutDate: { $gt: today }
    }).lean()

    const totalGuestsToday = activeReservations.reduce((sum, r) =>
      sum + (r.guests || 0) + (r.children || 0), 0
    )

    // Expected checkouts today
    const expectedCheckouts = await TentReservation.countDocuments({
      ...tentSpotFilter,
      status: 'reserved',
      checkoutDate: { $gte: today, $lt: tomorrow }
    })

    // Vacant tents calculation
    const allTents = await Tent.find({ ...tentSpotFilter, isDisabled: false }).lean()
    const totalTentCapacity = allTents.reduce((sum, tent) => sum + (tent.tentCount || 1), 0)

    const occupiedTentIds = new Set()
    activeReservations.forEach(r => {
      if (r.tents && Array.isArray(r.tents)) {
        r.tents.forEach(tentId => occupiedTentIds.add(tentId))
      }
    })
    const vacantTents = totalTentCapacity - occupiedTentIds.size

    // Payment breakdown (last 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentReservations = await TentReservation.find({
      ...tentSpotFilter,
      createdAt: { $gte: thirtyDaysAgo }
    }).lean()

    const paymentStats = recentReservations.reduce((acc, r) => {
      acc[r.paymentStatus] = (acc[r.paymentStatus] || 0) + 1
      return acc
    }, {})

    const totalPayments = recentReservations.length || 1
    const paymentBreakdown = [
      { name: 'paid', value: Math.round(((paymentStats.paid || 0) / totalPayments) * 100) },
      { name: 'pending', value: Math.round(((paymentStats.pending || 0) / totalPayments) * 100) },
      { name: 'unpaid', value: Math.round(((paymentStats.unpaid || 0) / totalPayments) * 100) },
      { name: 'Failed', value: Math.round(((paymentStats.failed || 0) / totalPayments) * 100) },
      { name: 'refunded', value: Math.round(((paymentStats.refunded || 0) / totalPayments) * 100) }
    ].filter(item => item.value > 0)

    // Last 5 bookings
    const last5Bookings = await TentReservation.find(tentSpotFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    const last5BookingsFormatted = await Promise.all(
      last5Bookings.map(async (booking) => {
        let tentSpotName = 'Unknown'
        let tentName = 'Unknown'

        if (booking.tentSpot && mongoose.Types.ObjectId.isValid(booking.tentSpot)) {
          const tentSpot = await TentSpot.findById(booking.tentSpot).select('spotName').lean()
          if (tentSpot) tentSpotName = tentSpot.spotName
        }

        if (booking.tents && booking.tents.length > 0) {
          const firstTentId = booking.tents[0]
          if (mongoose.Types.ObjectId.isValid(firstTentId)) {
            const tent = await Tent.findById(firstTentId).select('tentId').lean()
            if (tent) tentName = tent.tentId || 'Unknown'
          }
        }

        return {
          id: booking.bookingId || booking._id.toString().slice(-6),
          guest: booking.fullName || 'Guest',
          tentSpot: tentSpotName,
          tent: tentName,
          status: booking.paymentStatus === 'paid' ? 'paid' : booking.paymentStatus === 'pending' ? 'pending' : 'unpaid',
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

      const reservationsOnDate = await TentReservation.countDocuments({
        ...tentSpotFilter,
        status: 'reserved',
        checkinDate: { $lte: nextDate },
        checkoutDate: { $gt: date }
      })

      const occupancyRate = totalTentCapacity > 0
        ? Math.round((reservationsOnDate / totalTentCapacity) * 100)
        : 0

      occupancy7Day.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        occupancy: occupancyRate
      })
    }

    // Tent spot-specific vacant tents
    const tentSpotVacantTents = {}
    for (const tentSpot of tentSpots) {
      const spotTents = await Tent.find({ tentSpot: tentSpot._id, isDisabled: false }).lean()
      const spotTotalCapacity = spotTents.reduce((sum, tent) => sum + (tent.tentCount || 1), 0)

      const spotActiveReservations = await TentReservation.find({
        tentSpot: tentSpot._id.toString(),
        status: 'reserved',
        checkinDate: { $lte: tomorrow },
        checkoutDate: { $gt: today }
      }).lean()

      const spotOccupiedTentIds = new Set()
      spotActiveReservations.forEach(r => {
        if (r.tents && Array.isArray(r.tents)) {
          r.tents.forEach(tentId => spotOccupiedTentIds.add(tentId))
        }
      })

      tentSpotVacantTents[tentSpot._id.toString()] = spotTotalCapacity - spotOccupiedTentIds.size
    }

    res.json({
      success: true,
      stats: {
        totalBookingsToday,
        vacantTents,
        totalGuestsToday,
        expectedCheckouts
      },
      paymentBreakdown,
      last5Bookings: last5BookingsFormatted,
      occupancy7Day,
      tentSpots: tentSpots.map(ts => ({
        id: ts._id.toString(),
        name: ts.spotName,
        vacantToday: tentSpotVacantTents[ts._id.toString()] || 0
      }))
    })
  } catch (err) {
    console.error('getTentDashboardStats error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get tourist spot dashboard statistics
export const getTouristDashboardStats = async (req, res) => {
  try {
    const { spotId } = req.query

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Yesterday
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // First day of this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Build query filter
    const spotFilter = spotId ? { 'touristSpots.spotId': spotId } : {}

    // Get all tourist spots
    const touristSpots = await TouristSpot.find().lean()

    // 1. STATS & COMPARISON
    // Today's Reservations
    const todaysReservations = await TouristSpotReservation.find({
      ...spotFilter,
      createdAt: { $gte: today, $lt: tomorrow }
    }).lean()

    // Yesterday's Reservations
    const yesterdaysReservations = await TouristSpotReservation.find({
      ...spotFilter,
      createdAt: { $gte: yesterday, $lt: today }
    }).lean()

    const todayBookings = todaysReservations.length
    const todayRevenue = todaysReservations
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalPayable || 0), 0)
    const todayCancellations = todaysReservations.filter(r => r.status === 'cancelled' || r.paymentStatus === 'Failed').length
    
    // Total Guests Today calculation (touristSpots.visitDate is today)
    const activeReservationsToday = await TouristSpotReservation.find({
      ...spotFilter,
      status: 'reserved',
      'touristSpots.visitDate': { $gte: today, $lt: tomorrow }
    }).lean()

    const todayGuests = activeReservationsToday.reduce((sum, r) => {
      const validSpots = r.touristSpots.filter(ts => {
        const visitDate = new Date(ts.visitDate);
        const isToday = visitDate >= today && visitDate < tomorrow;
        const matchesFilter = spotId ? ts.spotId === spotId : true;
        return isToday && matchesFilter;
      });
      const spotsGuests = validSpots.reduce((sSum, spot) => 
        sSum + (spot.counts?.guests || (spot.counts?.adults || 0) + (spot.counts?.children || 0)), 0);
      return sum + spotsGuests;
    }, 0)

    // Upcoming Count (next 7 days)
    const next7Days = new Date(today)
    next7Days.setDate(next7Days.getDate() + 7)
    
    const upcomingCount = await TouristSpotReservation.countDocuments({
      ...spotFilter,
      status: 'reserved',
      'touristSpots.visitDate': { $gte: tomorrow, $lt: next7Days }
    })

    const comparison = {
      bookings: todayBookings,
      cancellations: todayCancellations,
      revenueToday: todayRevenue,
      revenueYesterday: yesterdaysReservations
        .filter(r => r.paymentStatus === 'paid')
        .reduce((sum, r) => sum + (r.totalPayable || 0), 0)
    }

    // 2. MONTHLY SUMMARY & TOP SPOTS
    const thisMonthReservations = await TouristSpotReservation.find({
      ...spotFilter,
      createdAt: { $gte: startOfMonth }
    }).lean()

    const monthlySummary = {
      totalBookings: thisMonthReservations.length,
      totalGuests: 0,
      totalRevenue: thisMonthReservations
        .filter(r => r.paymentStatus === 'paid')
        .reduce((sum, r) => sum + (r.totalPayable || 0), 0)
    }

    // Calculate monthly guests and top spots
    const spotStats = {}
    
    thisMonthReservations.forEach(r => {
      // Add guests for the month
      let rGuests = 0
      r.touristSpots.forEach(ts => {
        const matchesFilter = spotId ? ts.spotId === spotId : true;
        if (matchesFilter) {
           const g = (ts.counts?.guests || (ts.counts?.adults || 0) + (ts.counts?.children || 0))
           rGuests += g
           
           // Aggregate top spots
           const sId = ts.spotId || ts.name
           if (!spotStats[sId]) {
             spotStats[sId] = { name: ts.name || 'Unknown', bookings: 0, guests: 0, revenue: 0 }
           }
           spotStats[sId].bookings += 1
           spotStats[sId].guests += g
           // Pro-rate revenue if multiple spots, or just add amounts.total if available
           if (r.paymentStatus === 'paid') {
             spotStats[sId].revenue += (ts.amounts?.total || r.totalPayable || 0)
           }
        }
      })
      monthlySummary.totalGuests += rGuests
    })

    const topSpots = Object.values(spotStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // 3. BOOKINGS BY CATEGORY (Pie Chart)
    const paymentStats = thisMonthReservations.reduce((acc, r) => {
      const status = r.paymentStatus || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    const bookingsByCategory = Object.entries(paymentStats).map(([name, value]) => ({ name, value }))
    
    const categoryStats = {}
    thisMonthReservations.forEach(r => {
      r.touristSpots.forEach(ts => {
        const name = ts.name || 'Unknown'
        categoryStats[name] = (categoryStats[name] || 0) + 1
      })
    })
    
    const bookingsBySpotCategory = Object.entries(categoryStats).map(([name, value]) => ({ name, value }))
    const pieData = spotId ? bookingsByCategory : bookingsBySpotCategory

    // 4. UPCOMING BOOKINGS (Next 7 Days)
    const upcomingReservations = await TouristSpotReservation.find({
      ...spotFilter,
      status: 'reserved',
      'touristSpots.visitDate': { $gte: tomorrow, $lt: next7Days }
    }).sort({ 'touristSpots.visitDate': 1 }).limit(10).lean()

    const upcomingBookings = upcomingReservations.map(r => {
      // Find the relevant spot
      let primarySpotName = 'Multiple Spots'
      let visitDate = r.createdAt
      let spotsGuests = 0
      
      if (r.touristSpots && r.touristSpots.length > 0) {
         const spot = spotId ? r.touristSpots.find(ts => ts.spotId === spotId) : r.touristSpots[0]
         if (spot) {
           primarySpotName = spot.name || 'Unknown'
           visitDate = spot.visitDate || visitDate
           spotsGuests = spot.counts?.guests || (spot.counts?.adults || 0) + (spot.counts?.children || 0)
         }
      }
      
      return {
        id: r.bookingId || r._id.toString().slice(-6),
        date: visitDate,
        guestName: r.user?.name || 'Guest',
        trekSpot: primarySpotName,
        guests: spotsGuests,
        amount: r.totalPayable || 0,
        status: r.status
      }
    })

    res.json({
      success: true,
      stats: {
        todayBookings,
        todayGuests,
        todayRevenue,
        todayCancellations,
        upcomingCount
      },
      comparison,
      topSpots,
      bookingsByCategory: pieData,
      upcomingBookings,
      monthlySummary
    })
  } catch (err) {
    console.error('getTouristDashboardStats error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
