import express from 'express'
import multer from 'multer'
import path from 'path'
import { createResort, listResorts, getResortById, updateResort } from '../controllers/resortController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

// Multer setup: store in tmp folder with original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'tmp/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

router.post('/add', requirePermission('canEdit'), upload.single('logo'), createResort)
router.get('/', listResorts)
router.get('/:id', getResortById)
router.put('/:id', requirePermission('canEdit'), upload.single('logo'), updateResort)

export default router
