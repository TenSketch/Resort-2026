import express from "express";
import { handleBilldeskWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// BillDesk webhook endpoint (no auth required - BillDesk calls this)
router.post("/billdesk", handleBilldeskWebhook);

export default router;
