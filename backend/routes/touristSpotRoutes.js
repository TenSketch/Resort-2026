import express from 'express'
import multer from 'multer'
import { createTouristSpot, listTouristSpots, getTouristSpotById, updateTouristSpot, deleteTouristSpot, deleteTouristSpotImage } from '../controllers/touristSpotController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

// Use memory storage since we're uploading directly to Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

router.post('/add', requirePermission('canEdit'), upload.array('images'), createTouristSpot)
router.get('/', listTouristSpots)
router.get('/:id', getTouristSpotById)
router.put('/:id', requirePermission('canEdit'), upload.array('images'), updateTouristSpot)
router.delete('/:id/images/:publicId', requirePermission('canEdit'), deleteTouristSpotImage)
router.delete('/:id', requirePermission('canDisable'), deleteTouristSpot)

export default router
