import express from 'express'
import { getDailyOccupancyReport, getDailyOccupancyReportBySlug, getDashboardStats, getTentDashboardStats, getTouristDashboardStats } from '../controllers/reportsContoller.js'

const router = express.Router()

// Get dashboard statistics
router.get('/dashboard', getDashboardStats)

// Get tent dashboard statistics
router.get('/tent-dashboard', getTentDashboardStats)

// Get tourist spot dashboard statistics
router.get('/tourist-dashboard', getTouristDashboardStats)

// Get daily occupancy report by resort ID
router.get('/daily-occupancy/:resortId', getDailyOccupancyReport)

// Get daily occupancy report by resort slug (e.g., 'vanavihari' or 'junglestar')
router.get('/daily-occupancy/slug/:slug', getDailyOccupancyReportBySlug)

export default router
