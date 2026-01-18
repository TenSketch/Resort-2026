# How to Add Karthikavanam SMS Template

## Current Status
✅ Code is ready and waiting for template details
⏳ Placeholder template added with TODO markers

## Supported Slugs
The code will match either of these slugs:
- `karthikavanam-valamuru`
- `karthikavanam`

## When You Get the Template ID

### Step 1: Update Template Configuration
Open `backend/config/smsTemplates.js` and update the KARTHIKAVANAM section:

```javascript
// KARTHIKAVANAM - Tent booking template
KARTHIKAVANAM: {
  source: 'ACTUAL_SOURCE_ID',  // Replace with actual source ID from SMS provider
  tempid: 'ACTUAL_TEMPLATE_ID', // Replace with actual template ID
  getMessage: (data) => 
    `Your actual approved message template here with ${data.fullName}, ${data.bookingId}, etc.`
}
```

### Step 2: Get Template Details from SMS Provider

You'll need:
1. **Source ID** (Header) - e.g., 'KRTVNM' or similar
2. **Template ID** - The unique ID for this template
3. **Approved Message** - The exact message approved by your SMS provider

### Step 3: Update the Template

Replace the placeholder values:

**Before:**
```javascript
KARTHIKAVANAM: {
  source: 'KRTVNM', // TODO: Update with actual source ID
  tempid: 'PENDING_TEMPLATE_ID', // TODO: Update
  getMessage: (data) => 
    `Dear ${data.fullName}, Your Karthikavanam tent booking is confirmed! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -KARTHIKAVANAM`
}
```

**After (example):**
```javascript
KARTHIKAVANAM: {
  source: 'KRTVNM',
  tempid: '1107176807123456789',
  getMessage: (data) => 
    `Dear ${data.fullName}, Your Karthikavanam stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -KARTHIKAVANAM`
}
```

### Step 4: Test the Template

Run the test:
```bash
cd backend
node test-sms.js
```

Or create a test booking with `resortSlug: 'karthikavanam-valamuru'` or `resortSlug: 'karthikavanam'`

### Step 5: Verify in Logs

Check console for:
```
📱 Preparing tent reservation SMS for booking: TENT1234
📱 Sending SMS to: 919384318546
📱 Resort: karthikavanam-valamuru
📱 Source: KRTVNM, Template ID: 1107176807123456789
✅ Tent reservation SMS sent successfully to 919384318546
```

## Important Notes

### Resort Slug Matching
The code checks for both slug variations:
- `resortSlug === 'karthikavanam-valamuru'`
- `resortSlug === 'karthikavanam'`

Make sure your database has one of these slugs:
- In TentSpot model: `slug: 'karthikavanam-valamuru'` or `slug: 'karthikavanam'`
- Or in TentReservation: `resortSlug: 'karthikavanam-valamuru'` or `resortSlug: 'karthikavanam'`

### Template Variables Available
You can use these in your message:
- `${data.fullName}` - Customer name
- `${data.bookingId}` - Booking ID
- `${data.checkIn}` - Check-in date (formatted as DD-MMM-YYYY)
- `${data.checkOut}` - Check-out date (formatted as DD-MMM-YYYY)
- `${data.amount}` - Amount paid (formatted as 0.00)

### Message Format
Keep the message similar to existing templates:
- Start with "Dear {Name}"
- Include booking ID
- Include dates
- Include amount
- End with resort name

## Example Template Request to SMS Provider

When requesting the template, use this format:

**Template Name:** Karthikavanam Tent Booking Confirmation

**Template Type:** Transactional

**Template Content:**
```
Dear {#var#}, Your Karthikavanam stay is booked! ID: {#var#}, Check-in: {#var#}, Check-out: {#var#}, Paid: INR {#var#}. More info emailed. Enjoy your visit! -KARTHIKAVANAM
```

**Variables:**
1. Customer Name
2. Booking ID
3. Check-in Date
4. Check-out Date
5. Amount Paid

## No Code Changes Needed!

Once you update the template configuration:
- ✅ No changes to service files
- ✅ No changes to controllers
- ✅ No changes to integration points
- ✅ Just restart the server

The code already handles both `karthikavanam-valamuru` and `karthikavanam` slugs and will automatically use the template when a booking is made for that resort!
