import express from 'express';
import {
  createTentSpot,
  getAllTentSpots,
  getTentSpotById,
  getTentSpotBySlug,
  updateTentSpot,
  toggleTentSpotStatus,
  deleteTentSpot,
} from '../controllers/tentSpotController.js';
import requirePermission from '../middlewares/requirePermission.js';

const tentSpotRouter = express.Router();

// Public routes
tentSpotRouter.get('/', getAllTentSpots);
tentSpotRouter.get('/slug/:slug', getTentSpotBySlug);
tentSpotRouter.get('/:id', getTentSpotById);

// Protected routes (require admin authentication and permissions)
tentSpotRouter.post('/', requirePermission('canEdit'), createTentSpot);
tentSpotRouter.put('/:id', requirePermission('canEdit'), updateTentSpot);
tentSpotRouter.patch('/:id/toggle-status', requirePermission('canDisable'), toggleTentSpotStatus);
tentSpotRouter.delete('/:id', requirePermission('canEdit'), deleteTentSpot);

export default tentSpotRouter;
