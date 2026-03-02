# Resort Booking System – Complete Flow & Architecture Deep Dive
*Date: March 2026*

## 1. Executive Summary & Database Mapping
The system is a Node.js/Express application using MongoDB, serving an Angular frontend.
**Data Flow from DB to Frontend:**
- **Rooms data** comes from the `rooms` and `cottageTypes` collections.
- **Resorts data** comes from the `resorts` collection (e.g., Vanavihari, Jungle Star).
- **Trek data** comes from the `touristSpots` collection.
- **Tent data** comes from the `tentSpots` collection.

---

## 2. Universal Booking & Timers (Frontend to Backend)

### The 5-Minute BillDesk Lock
1. **Adding to Cart (Frontend Logic)**: 
   When a user clicks "Book Now" for rooms or treks, the frontend navigates to the checkout component (`tourist-spots-checkout.component.ts` or `booking-summary.component.ts`).
2. **Backend Pre-Reservation**:
   Clicking "Proceed to Pay" calls `<Type>PaymentController.js` (e.g., `paymentController.js` or `touristSpotPaymentController.js`). This creates:
   - A `Reservation` document with status **Pending**.
   - A `PaymentTransaction` document.
3. **Room Availability & Locking**:
   - Before allowing checkout, `checkRoomAvailability.js` is triggered.
   - Any room attached to a `Pending` checkout request is **locked** and cannot be selected by another client.
4. **The Timer**:
   - The frontend enforces a strict 5-minute countdown clock.
   - If payment via BillDesk is incomplete after 5 minutes, or if the user cancels from BillDesk and returns, the `transactionPoller.js` detects the expiry or the frontend explicitly cancels.
   - The `Reservation` is marked as **Failed/Cancelled** internally, releasing the temporary lock on the rooms to the public pool API.

---

## 3. Core Booking Modules & API Maps

### A. Room Bookings
- **API (Frontend)**: `GET /api/available-rooms` (Called in `rooms.component.ts` on date/guest filter).
- **Logic**: Filters out rooms tied to `Approved` or `Pending` (active) reservations.
- **Payment API**: `POST /api/payment/pay` -> Redirects to Billdesk.
- **Success Handling**: On BillDesk success callback:
  - Generates Email (`reservationEmailService.js`).
  - Calls `sendRoomReservationSMS` in `reservationSmsService.js` (DLT full templates: Vanavihari/Jungle Star).
  - Triggers internal dashboard `Notification` for admins.

### B. Trek Bookings
- **API (Frontend)**: `GET /api/tourist-spots` (Called in `search-tourist-spot`).
- **Data & Pricing**: Derived from `TouristSpot` model. Includes `entryFees`, `cameraFees`, and max capacity (controlled via frontend validators).
- **Guests**: Trek pricing scales dynamically by multiplying base `entryFees` by the total number of adults/children. Extra guests trigger calculation logic in `tourist-spots-checkout.component.ts`.
- **Payment API**: `POST /api/tourist-spot-payment/pay`.
- **Success Handling**:
  - Updates to **Success**.
  - Sends specific Trek DLT SMS confirming the exact Visit Date via `sendTrekReservationSMS()`.

---

## 4. Role-Based Access Control (RBAC) & DFO Logic
Users authenticate via roles defined in `adminModel.js`: `['superadmin', 'admin', 'dfo', 'staff']`. Granular flags (`canEdit`, `canAddReservations`, `canViewDownload`, etc.) modify exact behavior.

#### Super Admin
- **Powers**: Absolute core access.
- **Actions**: Can bypass the DFO 12-hour limit, manually approve/reject any reservation spanning any branch, edit user permissions, export all data across resorts, and block/unblock rooms indefinitely.

#### Admin / Coordinator
- **Powers**: Day-to-day branch management.
- **Actions**: Can create *Pending* bookings for walk-in tourists, view dashboard stats. Cannot unilaterally finalize complimentary/blocked quotas without DFO approval.

#### DFO (District Forest Officer) - 12-Hour Approval Logic
- **Powers**: High-level bureaucratic approval layer.
- **Workflow**: 
  1. An `admin` creates a manual backend reservation for restricted quotas.
  2. The system places the booking in **Pending DFO Approval** and locks the rooms.
  3. The `dfo` logs in and sees a red notification.
  4. **The 12-Hour Limit**: A background CRON or check logic expires the booking if the DFO does not click "Approve" within 12 hours, automatically unblocking the room and returning it to public inventory.

#### Staff
- **Powers**: Restricted operational access.
- **Actions**: Can view bookings for today's check-ins/check-outs, help with physical guest onboarding. Usually cannot edit, delete, or run global financial reports unless explicitly granted via granular permissions.

---

## 5. Cancellation Flow (Guest & Admin View)

### Logic map: `PUT /api/reservation/:id`
1. **Frontend Action**: Guest clicks "Cancel" in their portal or an Admin clicks "Cancel Booking" in the CMS.
2. **Controller (`reservationController.js` -> `updateReservation()`)**:
   - Calculates time until check-in.
   - If < 24 hours, `refundAmount = 0`. Else applies standard percentage rules.
   - Sets status to **Cancelled** and instantly unblocks the `roomModel` inventory.
3. **Internal Notifications**:
   - Creates a new `Notification` model doc. `targetRoles: ['superadmin', 'dfo']`.
4. **SMS & Email Outbound**:
   - Invokes `sendCancellationSMS()`.
   - **Guest SMS**: Dynamically selects between 4 DLT formats (e.g., Jungle Star Partial Refund, Vanavihari No-Refund).
   - **Admin SMS**: Simultaneously pings the designated `SMS_ADMIN_PHONE` with a breakdown of the lost resort booking so ground staff know immediately.
