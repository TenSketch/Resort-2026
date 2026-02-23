import express from 'express'
import { listAdmins, createAdmin, updateAdmin, deleteAdmin } from '../controllers/adminController.js'
import requireRole from '../middlewares/requireRole.js'

const router = express.Router()

// All routes require superadmin role except for listing users which allows DFO for filtering
router.get('/users', requireRole('superadmin', 'dfo'), listAdmins)
router.post('/users', requireRole('superadmin'), createAdmin)
router.put('/users/:id', requireRole('superadmin'), updateAdmin)
router.delete('/users/:id', requireRole('superadmin'), deleteAdmin)

export default router
