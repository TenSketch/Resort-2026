import express from 'express'
import { createAmenity, listAmenities, updateAmenityStatus, updateAmenity } from '../controllers/amenityController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/add', createAmenity)
router.get('/', listAmenities)
router.patch('/:id/status', updateAmenityStatus)
router.put('/:id', requirePermission('canEdit'), updateAmenity)

export default router
