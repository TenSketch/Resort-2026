import express from 'express'
import multer from 'multer'
import { createRoom, listRooms, listAvailableRooms, updateRoom, getNextRoomId, deleteRoomImage } from '../controllers/roomController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

// Use memory storage since we're uploading directly to Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

import adminAuth from '../middlewares/adminAuth.js'

router.post('/add', adminAuth, upload.array('images'), createRoom)
router.get('/', listRooms)
router.get('/admin/all', adminAuth, listRooms) // Admin route to get all rooms including disabled
router.get('/available', listAvailableRooms)
router.get('/next-room-id/:resortId', getNextRoomId)
router.put('/:id', adminAuth, upload.array('images'), updateRoom)
router.delete('/:id/images/:publicId', adminAuth, deleteRoomImage)

export default router
