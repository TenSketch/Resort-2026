import BilldeskWebhook from "../models/billdeskWebhookModel.js";

// Handle BillDesk webhook - just store everything they send
export const handleBilldeskWebhook = async (req, res) => {
  try {
    console.log("\n=== BILLDESK WEBHOOK RECEIVED ===");
    console.log("Request Method:", req.method);
    console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Request Body Type:", typeof req.body);
    console.log("Request Body:", req.body);
    console.log("Request Query:", JSON.stringify(req.query, null, 2));
    console.log("================================\n");

    // Handle different body types
    let bodyData = req.body;
    
    // If body is a string (raw text), store it as is
    if (typeof req.body === 'string') {
      bodyData = { rawText: req.body };
    }

    // Create webhook record - store everything
    const webhookData = new BilldeskWebhook({
      rawPayload: {
        body: bodyData,
        query: req.query,
        params: req.params,
        contentType: req.headers['content-type']
      },
      headers: req.headers,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      
      // Try to extract common fields if present
      orderid: req.body?.orderid || req.query?.orderid,
      transactionid: req.body?.transactionid || req.query?.transactionid,
      auth_status: req.body?.auth_status || req.query?.auth_status,
      amount: req.body?.amount || req.query?.amount
    });

    await webhookData.save();

    console.log("✅ Webhook data stored with ID:", webhookData._id);

    // Send success response to BillDesk
    return res.status(200).json({
      success: true,
      message: "Webhook received and stored",
      webhookId: webhookData._id
    });

  } catch (err) {
    console.error("❌ handleBilldeskWebhook Error:", err);
    
    // Try to store error info
    try {
      const errorWebhook = new BilldeskWebhook({
        rawPayload: {
          body: typeof req.body === 'string' ? { rawText: req.body } : req.body,
          query: req.query,
          params: req.params,
          contentType: req.headers['content-type']
        },
        headers: req.headers,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        error: err.message
      });
      await errorWebhook.save();
    } catch (saveErr) {
      console.error("❌ Failed to save error webhook:", saveErr);
    }

    return res.status(500).json({
      success: false,
      error: "Failed to process webhook"
    });
  }
};
