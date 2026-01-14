import express from 'express';
import {
  createTentType,
  getAllTentTypes,
  getTentTypeById,
  updateTentType,
  toggleTentTypeStatus,
  deleteTentType,
} from '../controllers/tentTypeController.js';
import requirePermission from '../middlewares/requirePermission.js';

const tentTypeRouter = express.Router();

// Public routes
tentTypeRouter.get('/', getAllTentTypes);
tentTypeRouter.get('/:id', getTentTypeById);

// Protected routes (require admin authentication and permissions)
tentTypeRouter.post('/add', requirePermission('canEdit'), createTentType);
tentTypeRouter.put('/:id', requirePermission('canEdit'), updateTentType);
tentTypeRouter.patch('/:id/toggle-status', requirePermission('canDisable'), toggleTentTypeStatus);
tentTypeRouter.delete('/:id', requirePermission('canEdit'), deleteTentType);

export default tentTypeRouter;
