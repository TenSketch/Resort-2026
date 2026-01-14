import express from 'express'
import { createLog, getLogs, updateLog } from '../controllers/logController.js'

const router = express.Router()

router.post('/', createLog)
router.get('/', getLogs)
router.put('/:bookingId', updateLog)

export default router
