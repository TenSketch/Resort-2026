import express from "express";
import { initiatePayment, handlePaymentCallback, handleWebhookCallback, retrieveTransactionStatus } from "../controllers/touristSpotPaymentController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Initiate payment (requires user authentication)
router.post("/initiate", auth, initiatePayment);

// Payment callback from BillDesk (RU - no auth required, redirect only)
router.post("/callback", handlePaymentCallback);
router.get("/callback", handlePaymentCallback);

// Webhook from BillDesk (S2S - no auth required, DB update)
router.post("/webhook", handleWebhookCallback);

// Retrieve transaction status (requires user authentication)
router.get("/transaction/:bookingId", auth, retrieveTransactionStatus);

export default router;
