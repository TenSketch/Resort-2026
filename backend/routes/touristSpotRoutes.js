import express from 'express'
import multer from 'multer'
import { createTouristSpot, listTouristSpots, getTouristSpotById, updateTouristSpot, deleteTouristSpot } from '../controllers/touristSpotController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'tmp/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

router.post('/add', requirePermission('canEdit'), upload.array('images'), createTouristSpot)
router.get('/', listTouristSpots)
router.get('/:id', getTouristSpotById)
router.put('/:id', requirePermission('canEdit'), upload.array('images'), updateTouristSpot)
router.delete('/:id', requirePermission('canDisable'), deleteTouristSpot)

export default router
