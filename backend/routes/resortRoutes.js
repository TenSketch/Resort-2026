import express from 'express'
import multer from 'multer'
import { createResort, listResorts, getResortById, updateResort } from '../controllers/resortController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

// Use memory storage since we're uploading directly to Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

router.post('/add', requirePermission('canEdit'), upload.single('logo'), createResort)
router.get('/', listResorts)
router.get('/:id', getResortById)
router.put('/:id', requirePermission('canEdit'), upload.single('logo'), updateResort)

export default router
