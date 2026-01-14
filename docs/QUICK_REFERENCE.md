# Payment Integration - Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Backend
cd backend
npm install
node index.js

# Frontend
cd frontend
npm install
npm start
```

---

## 🔑 Environment Variables

```env
# backend/.env
BILLDESK_MERCID=your_merchant_id
BILLDESK_CLIENTID=your_client_id
BILLDESK_ENCRYPTION_KEY=your_32_char_key
BILLDESK_SIGNING_KEY=your_signing_key
KEY_ID=your_key_id
BILLDESK_RETURN_URL=http://localhost:5000/api/payment/callback
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reservations/book` | ✅ | Create pre-reservation |
| POST | `/api/payment/initiate` | ✅ | Initiate payment |
| POST | `/api/payment/callback` | ❌ | BillDesk callback |
| GET | `/api/reservations/my-bookings` | ✅ | Get user bookings |

---

## 📊 Status Codes

### Reservation Status
- `pre-reserved` - Temporary booking (15 mins)
- `reserved` - Confirmed booking (paid)
- `cancelled` - Cancelled booking
- `completed` - Past booking

### Payment Status
- `unpaid` - No payment yet
- `paid` - Payment successful
- `failed` - Payment failed
- `pending` - Payment processing
- `refunded` - Payment refunded

### BillDesk Auth Status
- `0300` - Success ✅
- `0399` - Failed ❌
- `0002` - Pending ⏳
- `0398` - User Cancelled 🚫

---

## 🔄 Payment Flow (3 Steps)

```
1. Create Pre-Reservation
   POST /api/reservations/book
   → Returns bookingId

2. Initiate Payment
   POST /api/payment/initiate { bookingId }
   → Returns payment form data

3. Submit to BillDesk
   Auto-submit form → User pays → Callback
```

---

## 🧪 Testing

### UAT Test Bank
1. Select "Test Bank" under Net Banking
2. Choose scenario:
   - Success → auth_status: 0300
   - Failure → auth_status: 0399
   - Pending → auth_status: 0002

### Check Database
```javascript
// Reservation
db.reservations.findOne({ bookingId: "BK..." })

// Payment Transaction
db.paymenttransactions.findOne({ bookingId: "BK..." })
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Payment form not submitting | Check console logs, verify .env variables |
| Callback not received | Check BILLDESK_RETURN_URL, ensure server accessible |
| Signature verification failed | Check BILLDESK_SIGNING_KEY, no extra spaces |
| Decryption failed | Check BILLDESK_ENCRYPTION_KEY (32 chars) |
| Reservation expired | User must create new booking |

---

## 📝 Console Logs

### Success Flow
```
=== PAYMENT INITIATION ===
Booking ID: BK2109072510008
...
=========================

=== PAYMENT CALLBACK RECEIVED ===
Decrypted Response: { auth_status: "0300", ... }
Payment Status: success
Reservation Status: reserved
================================
```

---

## 🔐 Security Checklist

- [x] Keys in .env (not in code)
- [x] Signature verification
- [x] User authentication
- [ ] Rate limiting
- [ ] HTTPS in production

---

## 📞 Support

**BillDesk Issues:**
Provide: Decrypted request, response, trace ID, timestamp
(All stored in PaymentTransaction model)

**Internal Issues:**
Check: MongoDB, backend logs, frontend network tab

---

## 📚 Documentation Files

- `PAYMENT_INTEGRATION_IMPLEMENTATION.md` - Complete implementation details
- `PAYMENT_SETUP_GUIDE.md` - Step-by-step setup
- `BILLDESK_RESPONSE_CODES.md` - Response code reference
- `PAYMENT_FLOW_DIAGRAM.md` - Visual flow diagrams
- `IMPLEMENTATION_CHECKLIST.md` - Task checklist
- `QUICK_REFERENCE.md` - This file

---

## ⏰ Important Timings

- Pre-reservation expiry: **15 minutes**
- Payment completion window: **15 minutes**
- Pending payment verification: **After 15 mins** (future)

---

## 🎯 Next Steps

1. Add BillDesk credentials to `.env`
2. Test in UAT environment
3. Verify all scenarios work
4. Implement email notifications
5. Add cron job for expiry
6. Move to production

---

## 💡 Pro Tips

- Always check console logs first
- Test with small amounts in UAT
- Monitor first 10 production transactions
- Keep BillDesk support info handy
- Document any custom changes

---

**Version:** 1.0  
**Last Updated:** 2025-01-19  
**Status:** Ready for Testing
