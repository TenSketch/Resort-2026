import express from 'express'
import { createCottageType, listCottageTypes, getCottageType, updateCottageType, toggleDisableCottageType } from '../controllers/cottageTypeController.js'
import requirePermission from '../middlewares/requirePermission.js'

const router = express.Router()

// admin edits required for changes
router.post('/add', requirePermission('canEdit'), createCottageType)
router.get('/', listCottageTypes)
router.get('/:id', getCottageType)
router.put('/:id', requirePermission('canEdit'), updateCottageType)
router.patch('/:id/disable', requirePermission('canDisable'), toggleDisableCottageType)

export default router
