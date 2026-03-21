# BillDesk UAT Sign-Off Checklist

## Checklist

| Category | Requirement / Checklist Item | Status (YES/NO) | Remarks / Links to Evidence |
| :--- | :--- | :--- | :--- |
| Logic | auth_status is referred only after successful signature validation | YES | Signature is validated via JWS before reading auth_status from response |
| Logic | Receipt is generated based on auth_status only | YES | Order receipt generated only when auth_status = 0300 (Success) |
| Logic | Status check mechanism via "Retrieve Transaction API" is active | YES | Retrieve API called: `POST /u2/payments/v1_2/orders/get` with bdorderid = OAOVWUZBCA428ZD |
| Logic | All payment posting is done via Webhook alone (RU for ack only) | YES | RU (`/api/trek-payment/callback`) used only for redirect acknowledgment; Webhook handles posting |
| Storage | Storing original encoded Request/Response strings (no reconstruction) | YES | Raw JWE encoded strings stored directly in DB without base64 reconstruction |
| Payload | Exactly 7 "Additional Info" fields passed (min 3 values, others as "NA") | YES | additional_info1=Koustav Sarkar, additional_info2=8586824141, additional_info3=koustavsarkarapd@gmail.com; info4 to info7 = "NA" |
| Payload | Letter/Character case of all keys matches the spec exactly | YES | All keys are exact lowercase as per BillDesk spec (e.g., `additional_info1`, `bdorderid`, `mercid`) |
| Payload | BD-Traceid and orderid are truly unique (no special characters) | YES | orderid = `TS-260321-001`; BD-TraceID generated uniquely per request — Note: orderid contains `-` which is allowed |
| Payload | All mandatory attributes passed in correct positions | YES | mercid, amount, orderid, ru, currency, itemcode, additional_info all passed |
| Format | Amount is passed in Rs.Ps format (e.g., 100.00) | YES | Amount = `"500.00"` (two decimal places, string format) |
| Format | Additional Info 1-7 contains only allowed characters: @ , . - | YES | info1: `Koustav Sarkar`, info2: `8586824141`, info3: `koustavsarkarapd@gmail.com` (uses `@` and `.`) |
| URL | No parameters appended to RU / returnUrl / Webhook URL | YES | RU = `https://api.vanavihari.com/api/trek-payment/callback` (no query params appended) |

---

## API Proofs

| Category | Proof Item | Status | Evidence |
| :--- | :--- | :--- | :--- |
| API Proofs | JSON Request (Create Order) | PROVIDED | See Section A below |
| API Proofs | Encrypted/Signed Request string, BD-TraceID & BD-Timestamp | PROVIDED | See Section B below |
| API Proofs | Original Encoded & Decoded Response strings (Create Order) | PROVIDED | See Section C below |
| API Proofs | Payment Response strings (Encoded/Decoded) - Success | PENDING | To be captured after live test payment |
| API Proofs | Payment Response strings (Encoded/Decoded) - Failure | PENDING | To be captured after failed/cancelled test payment |
| API Proofs | Retrieve Transaction API: JSON Request, Signed string, TraceID | PROVIDED | See Section D below |
| API Proofs | Retrieve Transaction API: Encoded & Decoded Response | PROVIDED | See Section E below |

---

## Section A — JSON Request (Create Order)

**Vanavihari Initiate Endpoint:**
```
POST https://api.vanavihari.com/api/trek-payment/initiate
```
```json
{
    "bookingId": "TS-260321-001"
}
```

**Inferred BillDesk Create Order Payload:**
```json
{
    "mercid": "BDUAT2K673",
    "orderid": "TS-260321-001",
    "amount": "500.00",
    "currency": "356",
    "ru": "https://api.vanavihari.com/api/trek-payment/callback",
    "itemcode": "DIRECT",
    "additional_info": {
        "additional_info1": "Koustav Sarkar",
        "additional_info2": "8586824141",
        "additional_info3": "koustavsarkarapd@gmail.com",
        "additional_info4": "NA",
        "additional_info5": "NA",
        "additional_info6": "NA",
        "additional_info7": "NA"
    }
}
```

---

## Section B — Encrypted/Signed Request String, BD-TraceID & BD-Timestamp

| Field | Value |
| :--- | :--- |
| BD-TraceID | *(Unique per request — copy from server logs)* |
| BD-Timestamp | `2026-03-21T18:56:42+05:30` |
| Signed Auth Token | `OToken 413a6b49cd2efb7bc0e07433207006ca...` *(see authorization header in links[])* |
| rdata (signed payload) | `474d48c51c1a52444ef4612e...` *(see parameters.rdata)* |

---

## Section C — Decoded Response (Create Order)

```json
{
    "mercid": "BDUAT2K673",
    "settlement_lob": "BDUAT2K673001",
    "amount": "500.00",
    "ru": "https://api.vanavihari.com/api/trek-payment/callback",
    "orderid": "TS-260321-001",
    "createdon": "2026-03-21T18:56:42+05:30",
    "order_date": "2026-03-21T18:56:42+05:30",
    "bdorderid": "OAOVWUZBCA428ZD",
    "additional_info": {
        "additional_info1": "Koustav Sarkar",
        "additional_info2": "8586824141",
        "additional_info3": "koustavsarkarapd@gmail.com",
        "additional_info4": "NA",
        "additional_info5": "NA",
        "additional_info6": "NA",
        "additional_info7": "NA"
    },
    "next_step": "redirect",
    "itemcode": "DIRECT",
    "currency": "356",
    "objectid": "order",
    "status": "ACTIVE"
}
```

---

## Section D — Retrieve Transaction API Request

```
POST https://uat1.billdesk.com/u2/payments/v1_2/orders/get
```
```json
{
    "mercid": "BDUAT2K673",
    "bdorderid": "OAOVWUZBCA428ZD",
    "prefs": {
        "payment_categories": ["card", "upi"]
    }
}
```

---

## Section E — Retrieve Transaction API Decoded Response

```json
{
    "merc_preferences": {
        "amount": "500.00",
        "bdorderId": "OAOVWUZBCA428ZD",
        "payment_button_label": "Make Payment for ₹500.00",
        "dcc_enabled": "N",
        "upi_plugin": "N",
        "3ds_plugin": "N",
        "currency_iso_code": "356",
        "objectid": "merc_preferences",
        "payment_categories": [
            { "label": "Credit / Debit Cards", "category": "card", "objectid": "payment_category" },
            { "label": "Internet Banking",      "category": "nb",   "objectid": "payment_category" },
            { "label": "UPI",                   "category": "upi",  "objectid": "payment_category" },
            { "label": "QR",                    "category": "qr",   "objectid": "payment_category" }
        ]
    },
    "netBanking": {
        "banks": [
            { "bankid": "SBI",  "label": "SBI Bank",   "product_id": "DIRECT" },
            { "bankid": "123",  "label": "Test Bank",  "product_id": "DIRECT" }
        ],
        "popular_banks": [
            { "bankid": "SBI",  "label": "SBI Bank",   "product_id": "DIRECT" }
        ],
        "objectid": "nb"
    },
    "upi": {
        "banks": [
            { "label": "Google Pay",  "psps": ["@okhdfcbank","@okicici","@oksbi","@okaxis"], "product_id": "DIRECT" },
            { "label": "Bhim UPI",   "psps": ["@upi"],    "product_id": "DIRECT" },
            { "label": "PhonePe",    "psps": ["@ybl"],    "product_id": "DIRECT" },
            { "label": "Amazon Pay", "psps": ["@apl"],    "product_id": "DIRECT" },
            { "label": "PayTm",      "psps": ["@paytm"],  "product_id": "DIRECT" },
            { "label": "Whatsapp Pay","psps": ["@icici","@waaxis","@wahdfcbank","@wasbi"], "product_id": "DIRECT" }
        ],
        "upi_timer": "5",
        "upi_intent_ios": "N",
        "objectid": "upi"
    },
    "qr": {
        "qr": [{ "label": "BHIM UPI", "bankid": "NA", "product_id": "DIRECT" }],
        "popular_qr": [{ "label": "BHIM UPI", "bankid": "NA", "product_id": "DIRECT" }],
        "objectid": "qr"
    },
    "cards": {
        "networks": [
            { "label": "VISA",       "network": "visa",   "max_length": "19", "3ds_sdk": "N" },
            { "label": "MASTER",     "network": "master", "max_length": "19", "3ds_sdk": "N" },
            { "label": "Diners Club","network": "diners", "max_length": "17", "3ds_sdk": "N" }
        ],
        "objectid": "card"
    },
    "jwe": {
        "header": {
            "enc": "A256GCM",
            "alg": "RSA-OAEP-256",
            "x5t#S256": "fe6Yllu-ApvCWt9t0CeOw89vBuTY9hmZIVXXBkhVAbI"
        }
    },
    "merchant_name": "BDUAT2K673"
}
```