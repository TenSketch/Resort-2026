import express from 'express';
import { subscribeUser, unsubscribeUser, getVapidPublicKey } from '../controllers/pushController.js';
import adminAuth from '../middlewares/adminAuth.js';

const pushRouter = express.Router();

// Publicly accessible for the frontend to get the key
pushRouter.get('/vapid-public-key', getVapidPublicKey);

// Subscribing requires being logged in as an admin/staff
pushRouter.post('/subscribe', adminAuth, subscribeUser);
pushRouter.post('/unsubscribe', adminAuth, unsubscribeUser);

export default pushRouter;
