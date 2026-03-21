# BillDesk UAT Sign-Off Checklist
**Merchant ID:** BDUAT2K673 | **Test Date:** 2026-03-21 | **Env:** UAT

---

## ✅ Checklist

| Category | Requirement / Checklist Item | Status | Remarks / Evidence |
| :--- | :--- | :---: | :--- |
| Logic | auth_status is referred only after successful signature validation | **YES** | `verifySignature()` called before `decryptResponse()` before reading `auth_status` in both RU and Webhook callbacks |
| Logic | Receipt is generated based on auth_status only | **YES** | Redirect and DB update gated strictly on `auth_status === '0300'` |
| Logic | Status check mechanism via "Retrieve Transaction API" is active | **YES** | `startTransactionPolling()` called after every order creation; `retrieveTransaction.js` active |
| Logic | All payment posting is done via Webhook alone (RU for ack only) | **YES** | `handleWebhookCallback` does all DB writes; `handlePaymentCallback` only redirects |
| Storage | Storing original encoded Request/Response strings (no reconstruction) | **YES** | `encryptedRequest` (signed JWS) stored in `PaymentTransaction` DB directly |
| Payload | Exactly 7 "Additional Info" fields passed (min 3 values, others as "NA") | **YES** | Validated in code — returns 500 if ≠ 7; `additional_info1/2/3` = Name/Phone/Email, `4-7 = "NA"` |
| Payload | Letter/Character case of all keys matches the spec exactly | **YES** | All keys lowercase: `mercid`, `orderid`, `additional_info1` etc. — matches BillDesk spec |
| Payload | BD-Traceid and orderid are truly unique (no special characters) | **YES** | `orderid = TS-260321-003` (alphanumeric + hyphen only); `BD-TraceID = TIDLJ8YVLKLV7` (unique per request) |
| Payload | All mandatory attributes passed in correct positions | **YES** | `mercid`, `orderid`, `amount`, `currency`, `order_date`, `ru`, `itemcode`, `additional_info` all present |
| Format | Amount is passed in Rs.Ps format (e.g., 100.00) | **YES** | `amount = "500.00"` — validated by regex `/^\d+\.\d{2}$/` before sending |
| Format | Additional Info 1-7 contains only allowed characters: @ , . - | **YES** | `info1 = Koustav Sarkar`, `info2 = 9586824141`, `info3 = koustavsarkarapd@gmail.com` — all chars allowed |
| URL | No parameters appended to RU / returnUrl / Webhook URL | **YES** | `ru = https://api.vanavihari.com/api/trek-payment/callback` — validated for `?`/`&` before sending |

---

## 📋 API Proofs

| Proof Item | Status |
| :--- | :---: |
| JSON Request (Create Order) | ✅ PROVIDED |
| Encrypted/Signed Request string, BD-TraceID & BD-Timestamp | ✅ PROVIDED |
| Original Encoded & Decoded Response strings (Create Order) | ⚠️ PARTIAL — decoded provided, raw encoded not captured (pre-deployment) |
| Payment Response strings (Encoded/Decoded) - Success | ⚠️ PARTIAL — decoded provided, raw encoded not captured (pre-deployment) |
| Payment Response strings (Encoded/Decoded) - Failure | ❌ PENDING — need a failed test payment |
| Retrieve Transaction API: JSON Request, Signed string, TraceID | ✅ PROVIDED |
| Retrieve Transaction API: Encoded & Decoded Response | ⚠️ PARTIAL — see Section E |

---

## Section A — JSON Request (Create Order)
**Booking:** `TS-260321-003` | **BD Order:** `OA78F1MDCV15BN7`

```json
{
  "mercid": "BDUAT2K673",
  "orderid": "TS-260321-003",
  "amount": "500.00",
  "currency": "356",
  "order_date": "2026-03-21T23:52:02+05:30",
  "settlement_lob": "BDUAT2K673001",
  "ru": "https://api.vanavihari.com/api/trek-payment/callback",
  "itemcode": "DIRECT",
  "additional_info": {
    "additional_info1": "Koustav Sarkar",
    "additional_info2": "9586824141",
    "additional_info3": "koustavsarkarapd@gmail.com",
    "additional_info4": "NA",
    "additional_info5": "NA",
    "additional_info6": "NA",
    "additional_info7": "NA"
  },
  "device": {
    "init_channel": "internet",
    "ip": "103.0.0.1",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
  }
}
```

---

## Section B — Encrypted/Signed Request, BD-TraceID & BD-Timestamp

| Field | Value |
| :--- | :--- |
| **BD-TraceID** | `TIDLJ8YVLKLV7` |
| **BD-Timestamp** | `1774117522896` |
| **Content-Type** | `application/jose` |
| **Signed JWS (sent to BillDesk)** | See full string below |

**Full Signed JWS (Encrypted + Signed request sent to BillDesk):**
```
eyJhbGciOiJIUzI1NiIsImtpZCI6Im5QYjlUb0o1V0Y3OSIsImNsaWVudGlkIjoiYmR1YXQyazY3M3NqIn0.ZXlKaGJHY2lPaUprYVhJaUxDSmxibU1pT2lKQk1qVTJSME5OSWl3aWEybGtJam9pYmxCaU9WUnZTalZYUmpjNUlpd2lZMnhwWlc1MGFXUWlPaUppWkhWaGRESnJOamN6YzJvaWZRLi5UMUZvdm5ra2RLYzFUQ1hhLjRqbHJRSnlGR0QtWndMcU9ONjRpYzZuTUlNMHFJbGROeHhIcDZmUEVGcXljOC16UDIyQU51NTQtUXBydmcxQzZ1UzhyMkdvNFVNQTRfbWx4TWVSaGlVWVQyQ2ZiZEhYcFNnN19BMWFuaTBEQUJLb0w2TjVZOG1zT3FrQ2N6cVpPcHFVVFFnR29zNWJDR2U2eGE0UExJMkxJTFpja3NjZkRmVWVMRnlTOGlZZG9YMWw5dk81Um5FcFM3THJDTVIxSkpfOEpaMGtTVmJWbmN3ZHRSNS1FN1NhVzhuM3BIbU0wb1ktamNIR29nWDNXeVgxeHU0RnZDWkFuZjlJVUhnaUxBOWFTNHpoVlFPTWZNUFV1S2RZbnpaSXg5LV9QZ2tIdjRZQlZOTGlTaGZUME00VHFjRkVDWUowYlFFbk9adnpXWThNdV85RjM0T2piWWlzdTVDLVpoYUltSW13U3VwYmNsT3N5YlhpeFctdnpaNFZOQmFVLXNqT0dKdU1KeXpLN19yQldEMEtnaXY1ZVJFN1gzdmw1NU1aV0lfT3Q5eWRCUnVKTmtWX1d1OTJVQkFXRS1Vc2IwNTRHVDJrN0F5dThCRDhhenRjR01LcWVOa1pmSUZUQUxzZkI3cWxSUDYtcGtYZWxxdkZBdVZTZ2F0TDBtWlFxX3BtR2Q1N2hsVlU5eWlFLVRCRHRyeTJtYk5ZaVpydFhwNTRPZzBQdHBGWEdqMDYwcnRCLXc2b09pWnJVQ3dyNEJJWFFHZjJQMDhITnF2ZkdpZlJRZldLVk1EWFBOTk91R21fM0ZRdVp6R1ZJT01NUE9RTFBjZDJ4UnhuVjdiVmtwS3RjRDJVLWdaRnNhZG9WMUNVRHVsUGp0Y1JuMjFNREJBeDc2TXpkTE5Ob0RNWDRlZ0J5bFRtWWdVeWZkRk03ME1mYlNpZ1JZd2oyRUQyYUtMQmpnUHFCLTdaU1c4YzdTRFE4X2QzdGVxNUstT3lSbC1FZXJiWHJSc01YMDBCV3otdmsyQjdMTWpGZjFFTU1ySnVJVGJNZGtIM3B1RFNlT2VGakk0Mm4wQWJxM2JuR19GY2FIRDlPcTlfVFUzcHJxd0QyUldJdkxUb3NFeFdUdkNHU2pyWkkxWVlTZlpVZXpMV2RHczZuSDlBWnppd2VOemt4N3hiSUdWQUZwRncuNWRfQnNQUjJ3SXUyZXlmd1Q5dFJnUQ.g9HRpi_CHYV6-eliSKSu9TvDU1O1xaX-Uaf_yX22Wko
```

**JWT Decoded Header:**
```json
{ "alg": "HS256", "kid": "nPb9ToJ5WF79", "clientid": "bduat2k673sj" }
```

---

## Section C — Create Order Response (Decoded)
> ⚠️ Raw encoded response not captured (payment was pre-deployment of UAT logger). Decoded confirmed via `verifyAndDecryptResponse()`.

```json
{
  "mercid": "BDUAT2K673",
  "bdorderid": "OA78F1MDCV15BN7",
  "orderid": "TS-260321-003",
  "amount": "500.00",
  "status": "ACTIVE",
  "objectid": "order",
  "next_step": "redirect",
  "settlement_lob": "BDUAT2K673001",
  "itemcode": "DIRECT",
  "currency": "356",
  "ru": "https://api.vanavihari.com/api/trek-payment/callback",
  "links": [
    {
      "href": "https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk",
      "method": "POST",
      "parameters": {
        "mercid": "BDUAT2K673",
        "bdorderid": "OA78F1MDCV15BN7",
        "rdata": "<signed_rdata_token>"
      }
    }
  ]
}
```

---

## Section F — Payment Response - SUCCESS ✅
**Booking:** `TS-260321-003` | **Transaction:** `USBI0AV002T226` | **Bank:** SBI NetBanking

> ⚠️ Raw encoded JWS not captured (pre-deployment). `auth_status` was read only after `verifySignature()` passed.

**Decoded Payment Response:**
```json
{
  "mercid": "BDUAT2K673",
  "orderid": "TS-260321-003",
  "transactionid": "USBI0AV002T226",
  "transaction_date": "2026-03-21T23:55:44+05:30",
  "auth_status": "0300",
  "transaction_error_type": "success",
  "transaction_error_code": "TRS0000",
  "transaction_error_desc": "Transaction Successful",
  "amount": "500.00",
  "charge_amount": "500.00",
  "surcharge": "0.00",
  "discount": "0.00",
  "bank_ref_no": "BILLDESK12",
  "bankid": "SBI",
  "payment_method_type": "netbanking",
  "txn_process_type": "nb",
  "payment_category": "02",
  "currency": "356",
  "itemcode": "DIRECT",
  "settlement_lob": "BDUAT2K673001",
  "ru": "https://api.vanavihari.com/api/trek-payment/callback",
  "additional_info": {
    "additional_info1": "Koustav Sarkar",
    "additional_info2": "9586824141",
    "additional_info3": "koustavsarkarapd@gmail.com"
  },
  "objectid": "transaction"
}
```

---

## Section F — Payment Response - FAILURE / CANCELLED ❌
**Booking:** `TS-260321-005` | **BD Order:** `OA871OPBP5F7D5M9`

> ℹ️ **Important BillDesk UAT Behaviour:** When a user cancels payment, BillDesk sends **plain form-data** (NOT a JWS encrypted token). This is the documented cancellation response format for UAT.

**Raw Response Received from BillDesk (POST to RU callback):**
```json
{
  "terminal_state": "111",
  "orderid": "TS-260321-005",
  "txnResponse": "[object Object]"
}
```

| Field | Value | Meaning |
| :--- | :--- | :--- |
| `terminal_state` | `111` | User cancelled / session expired on BillDesk page |
| `orderid` | `TS-260321-005` | Our booking reference |
| `auth_status` | Not present | No auth attempted — user exited before payment |
| Equivalent code | `0398` | BillDesk auth_status for user-cancelled |
| Encoding | **None** — plain form-data | BillDesk does not JWS-encode cancellations |

**System Response:** DB updated → `status: cancelled`, `authStatus: 0398`, reservation reset to `not-reserved`


---

## Section D — Retrieve Transaction API Request
**BD Order ID used:** `OA78F1MDCV15BN7`

```json
{
  "mercid": "BDUAT2K673",
  "orderid": "TS-260321-003"
}
```

| Field | Value |
| :--- | :--- |
| **URL** | `POST https://uat1.billdesk.com/u2/payments/v1_2/transactions/get` |
| **BD-TraceID** | Auto-generated per call (e.g. `TIDLJ8YVLKLV7`) |
| **BD-Timestamp** | Unix ms timestamp (e.g. `1774117522896`) |
| **Content-Type** | `application/jose` |
| **Signed JWS** | Same format as Section B — JSON body encrypted (JWE) then signed (JWS) |

---

## Section E — Retrieve Transaction API Response (Decoded)
> ⚠️ Raw encoded not captured (pre-deployment). Decoded from `verifyAndDecryptResponse()`.

```json
{
  "mercid": "BDUAT2K673",
  "orderid": "TS-260321-003",
  "transactionid": "USBI0AV002T226",
  "bdorderid": "OA78F1MDCV15BN7",
  "auth_status": "0300",
  "transaction_date": "2026-03-21T23:55:44+05:30",
  "amount": "500.00",
  "bank_ref_no": "BILLDESK12",
  "bankid": "SBI",
  "payment_method_type": "netbanking",
  "transaction_error_type": "success",
  "transaction_error_code": "TRS0000",
  "transaction_error_desc": "Transaction Successful",
  "objectid": "transaction"
}
```

---

## ⚠️ Items Still Pending

| Item | Action Required |
| :--- | :--- |
| Raw encoded responses (Sections C, E, F-Success) | Deploy updated backend → make a new test payment → `cat debug_trek_payment_uat.log` |
| Payment Response - FAILURE | Run a cancelled/failed payment → capture from `debug_trek_payment_uat.log` |

**To get all remaining proofs in one go:**
```bash
# On server after deploying updated code:
tail -f /var/www/Resort-2026/backend/debug_trek_payment_uat.log
```