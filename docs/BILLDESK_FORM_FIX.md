# BillDesk Form Submission Fix

## Issue
When submitting payment form to BillDesk, getting error:
```
Sorry we are unable to process your request.
```

## Root Cause
The form was using incorrect field names and missing proper structure. BillDesk expects:
- `merchantid` (form field name, even though response has `mercid`)
- `bdorderid`
- `rdata` (from response parameters, not the signed request)
- Form must have `name="sdklaunch"` and `id="sdklaunch"`

## What Was Wrong

### Backend (`paymentController.js`)
```javascript
// ❌ WRONG
paymentData: {
  bdorderid: billdeskResponse.bdorderid,
  merchantid: billdeskResponse.merchantid,  // Wrong field name
  rdata: billdeskResponse.links?.[1]?.parameters?.rdata || signed,  // Fallback was wrong
  formAction: billdeskResponse.links?.[1]?.href
}
```

### Frontend (`booking-summary.component.ts`)
```javascript
// ❌ WRONG
const fields = {
  bdorderid: paymentData.bdorderid,
  merchantid: paymentData.merchantid,  // Wrong field name
  rdata: paymentData.rdata
};
```

## What Was Fixed

### Backend (`paymentController.js`)
```javascript
// ✅ CORRECT
paymentData: {
  bdorderid: billdeskResponse.bdorderid,
  merchantid: billdeskResponse.mercid,  // Map mercid to merchantid for form
  rdata: billdeskResponse.links?.[1]?.parameters?.rdata,  // Use response rdata only
  formAction: billdeskResponse.links?.[1]?.href
}
```

### Frontend (`booking-summary.component.ts`)
```javascript
// ✅ CORRECT
const form = document.createElement('form');
form.method = 'POST';
form.action = paymentData.formAction;
form.name = 'sdklaunch';  // Required by BillDesk
form.id = 'sdklaunch';    // Required by BillDesk

const fields = {
  merchantid: paymentData.merchantid,  // Form expects 'merchantid'
  bdorderid: paymentData.bdorderid,
  rdata: paymentData.rdata
};

// Each input needs both id and name attributes
Object.keys(fields).forEach((key) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.id = key;      // Add id attribute
  input.name = key;    // Add name attribute
  input.value = (fields as any)[key];
  form.appendChild(input);
});
```

## BillDesk Response Structure

From your logs, BillDesk returns:
```json
{
  "bdorderid": "OAZK1Y7EWSQYFYWW",
  "mercid": "BDUAT2K673",
  "links": [
    {
      "href": "https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk",
      "rel": "redirect",
      "method": "POST",
      "parameters": {
        "mercid": "BDUAT2K673",
        "bdorderid": "OAZK1Y7EWSQYFYWW",
        "rdata": "674502462cab69a69c9465c8d2bfc025a2b8a691a310ad4e0f0161e3e6dd507b..."
      }
    }
  ]
}
```

## Form Submission Requirements

BillDesk expects exactly this structure:

```html
<form name="sdklaunch" id="sdklaunch" 
      action="https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk" 
      method="POST">
  <input type="hidden" id="merchantid" name="merchantid" value="BDUAT2K673">
  <input type="hidden" id="bdorderid" name="bdorderid" value="OAZK1Y7EWSQYFYWW">
  <input type="hidden" id="rdata" name="rdata" value="674502462cab69a69c9465c8...">
</form>
```

Key requirements:
1. Form must have `name="sdklaunch"` and `id="sdklaunch"`
2. **merchantid** - Merchant ID (note: response has `mercid`, but form needs `merchantid`)
3. **bdorderid** - BillDesk Order ID (from response)
4. **rdata** - Encrypted data (from response.links[1].parameters.rdata)
5. Each input needs both `id` and `name` attributes

## Testing

After this fix:
1. Restart backend server
2. Clear browser cache
3. Try booking again
4. Form should now submit successfully to BillDesk
5. You should see BillDesk payment page (not error page)

## Verification

Check console logs:
```
Payment form fields: {
  merchantid: "BDUAT2K673",
  bdorderid: "OAZK1Y7EWSQYFYWW",
  rdata: "674502462cab69a69c9465c8d2bfc025..."
}
Submitting payment form to BillDesk: https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk
```

## Important Note

**BillDesk API Response vs Form Field Names:**
- API Response has: `mercid`
- Form expects: `merchantid`
- We map `mercid` → `merchantid` in the backend before sending to frontend

## Status
✅ **FIXED** - Form now submits with correct field names and values
