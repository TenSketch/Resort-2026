import express from "express";
import { initiateTentPayment, handleTentPaymentCallback, retrieveTentTransactionStatus } from "../controllers/tentPaymentController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Initiate payment (requires user authentication)
router.post("/initiate", auth, initiateTentPayment);

// Payment callback from BillDesk (no auth required - BillDesk calls this)
router.post("/callback", handleTentPaymentCallback);
router.get("/callback", handleTentPaymentCallback);

// Retrieve transaction status (requires user authentication)
router.get("/transaction/:bookingId", auth, retrieveTentTransactionStatus);

export default router;
