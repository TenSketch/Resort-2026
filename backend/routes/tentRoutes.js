import express from 'express';
import multer from 'multer';
import {
  createTent,
  getAllTents,
  getTentById,
  updateTent,
  deleteImage,
  toggleTentStatus,
  deleteTent,
  getNextTentId,
  getAvailableTents,
} from '../controllers/tentController.js';
import requirePermission from '../middlewares/requirePermission.js';

const tentRouter = express.Router();

// Use memory storage since we're uploading directly to Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Public routes
tentRouter.get('/', getAllTents);
tentRouter.get('/available', getAvailableTents);
tentRouter.get('/next-tent-id/:tentSpotId', getNextTentId);
tentRouter.get('/:id', getTentById);

// Protected routes (require admin authentication and permissions)
tentRouter.post('/', requirePermission('canEdit'), upload.array('images', 10), createTent);
tentRouter.put('/:id', requirePermission('canEdit'), upload.array('images', 10), updateTent);
tentRouter.delete('/:id/image', requirePermission('canEdit'), deleteImage);
tentRouter.patch('/:id/toggle-status', requirePermission('canDisable'), toggleTentStatus);
tentRouter.delete('/:id', requirePermission('canEdit'), deleteTent);

export default tentRouter;
