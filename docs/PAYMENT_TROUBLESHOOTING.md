# Payment Integration Troubleshooting Guide

## Issue: "Sorry we are unable to process your request" on BillDesk

### Symptoms
- Payment redirect page loads successfully
- Shows loading spinner and payment details
- After 2 seconds, redirects to BillDesk
- BillDesk shows error: "Sorry we are unable to process your request"

### Root Cause
Missing or incorrect form fields being submitted to BillDesk.

---

## Required Form Fields

BillDesk requires **exactly 3 fields**:

1. **merchantid** - Merchant ID (e.g., "BDUAT2K673")
2. **bdorderid** - BillDesk Order ID (e.g., "OA8G1OTRG47KNKZQ")
3. **rdata** - Encrypted payment data

---

## Debugging Steps

### Step 1: Check Backend Logs

Look for this section in your backend console:

```
=== Payment Data for Frontend ===
merchantid: BDUAT2K673
bdorderid: OA8G1OTRG47KNKZQ
rdata: 81db49620296fccd036479c8244e2b992526b6584ca7b6af1a...
formAction: https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk
================================
```

**Check:**
- ✅ All three fields are present
- ✅ merchantid is not `undefined` or `null`
- ✅ bdorderid is present
- ✅ rdata is present and looks like encrypted data

### Step 2: Check Payment Redirect URL

Decode the URL parameter:
```
https://dev.vanavihari.com/payment-redirect.html?data=ENCODED_DATA
```

Decode `ENCODED_DATA` using:
```javascript
decodeURIComponent(ENCODED_DATA)
```

Should show:
```json
{
  "action": "https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk",
  "parameters": {
    "merchantid": "BDUAT2K673",  ← Must be present!
    "bdorderid": "OA8G1OTRG47KNKZQ",
    "rdata": "81db49620296fccd..."
  }
}
```

**If `merchantid` is missing**, the backend didn't send it.

### Step 3: Check Browser Console

Open browser console (F12) on payment-redirect.html page.

Look for:
```
Payment form data: {action: "...", parameters: {...}}
Form action: https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk
Submitting payment form to BillDesk...
```

Check the `parameters` object has all 3 fields.

### Step 4: Check Form Submission

In browser console, before form submits, inspect the form:
```javascript
document.getElementById('paymentForm')
```

Should show 3 hidden inputs:
- `<input name="merchantid" value="BDUAT2K673">`
- `<input name="bdorderid" value="OA8G1OTRG47KNKZQ">`
- `<input name="rdata" value="...">`

---

## Common Issues & Fixes

### Issue 1: merchantid is undefined

**Cause:** BillDesk response doesn't have `mercid` field

**Fix Applied:**
```javascript
// Backend now uses fallback
const merchantId = billdeskResponse.mercid 
  || billdeskResponse.links?.[1]?.parameters?.mercid 
  || process.env.BILLDESK_MERCID;
```

**Verify:** Check `.env` has `BILLDESK_MERCID=BDUAT2K673`

### Issue 2: rdata is missing

**Cause:** BillDesk response structure changed

**Check:** Backend logs show BillDesk response structure

**Fix:** Verify path to rdata:
```javascript
billdeskResponse.links?.[1]?.parameters?.rdata
```

### Issue 3: Form submits but BillDesk rejects

**Possible Causes:**
1. Wrong merchant ID
2. Expired rdata (older than 30 minutes)
3. Invalid rdata format
4. Wrong BillDesk environment (UAT vs Production)

**Check:**
- Merchant ID matches your BillDesk account
- Order was created recently (< 30 mins)
- Using correct BillDesk URL (UAT or Production)

---

## Validation Checklist

Before payment redirect:

- [ ] Backend creates BillDesk order successfully
- [ ] Backend logs show all 3 fields (merchantid, bdorderid, rdata)
- [ ] Frontend receives paymentData with all 3 fields
- [ ] Payment redirect URL contains all 3 fields in parameters
- [ ] Browser console shows form with 3 inputs
- [ ] Form submits to correct BillDesk URL

---

## Testing Commands

### Decode Payment URL
```javascript
// In browser console
const urlParams = new URLSearchParams(window.location.search);
const data = JSON.parse(decodeURIComponent(urlParams.get('data')));
console.log('Payment Data:', data);
console.log('Has merchantid?', !!data.parameters.merchantid);
console.log('Has bdorderid?', !!data.parameters.bdorderid);
console.log('Has rdata?', !!data.parameters.rdata);
```

### Check Form Before Submit
```javascript
// In browser console (on payment-redirect.html)
const form = document.getElementById('paymentForm');
console.log('Form action:', form.action);
console.log('Form inputs:', form.querySelectorAll('input'));
Array.from(form.querySelectorAll('input')).forEach(input => {
  console.log(`${input.name}: ${input.value.substring(0, 50)}...`);
});
```

---

## Backend Validation

The backend now validates all required fields before sending to frontend:

```javascript
if (!merchantId || !bdorderid || !rdata) {
  console.error('Missing required payment fields!');
  return res.status(500).json({
    success: false,
    error: 'Missing required payment fields from BillDesk response'
  });
}
```

If you see this error, check:
1. BillDesk API response structure
2. Environment variables (BILLDESK_MERCID)
3. BillDesk account configuration

---

## BillDesk Response Structure

Expected structure from BillDesk Create Order API:

```json
{
  "mercid": "BDUAT2K673",
  "bdorderid": "OA8G1OTRG47KNKZQ",
  "links": [
    {
      "href": "...",
      "rel": "self"
    },
    {
      "href": "https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk",
      "rel": "redirect",
      "method": "POST",
      "parameters": {
        "mercid": "BDUAT2K673",
        "bdorderid": "OA8G1OTRG47KNKZQ",
        "rdata": "81db49620296fccd..."
      }
    }
  ]
}
```

We extract:
- `mercid` from root level OR from `links[1].parameters.mercid`
- `bdorderid` from root level
- `rdata` from `links[1].parameters.rdata`

---

## Quick Fix Steps

1. **Restart backend server** (to apply new validation code)
2. **Clear browser cache**
3. **Try new booking**
4. **Check backend logs** for "Payment Data for Frontend"
5. **Check browser console** on payment-redirect.html
6. **Verify all 3 fields are present**

---

## Contact BillDesk Support

If all fields are correct but still getting error, contact BillDesk with:

1. **Merchant ID:** BDUAT2K673
2. **Order ID:** (from bdorderid)
3. **Timestamp:** (from backend logs)
4. **Trace ID:** (from backend logs)
5. **Encrypted Request:** (from backend logs)
6. **Error Message:** "Sorry we are unable to process your request"

All this information is logged in backend console.

---

## Status After Fix

✅ Backend now validates all required fields  
✅ Backend uses fallback for merchantid  
✅ Backend logs all payment data  
✅ Better error messages  
✅ Easier debugging  

**Next:** Restart backend and test again!
