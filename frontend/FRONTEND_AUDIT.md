

## 🗑️ FILES SAFE TO DELETE

### Duplicate / Backup / Junk Module Folders
These are entire folders that are safe to remove — they are duplicates or old development experiments.

| Folder | Reason |
|--------|--------|
| `src/app/modules/bio-diversity-zone/` | Duplicate of `biodiversity-zone/` |
| `src/app/modules/tourist-places copy/` | Backup copy of `tourist-places/` |
| `src/app/modules/booking-status-test/` | Test version of `booking-status/` |
| `src/app/modules/booking-status2/` | Second duplicate of `booking-status/` |
| `src/app/modules/test-bookings/` | Test version of `my-bookings/` |
| `src/app/modules/test-room/` | Test version of rooms module |
| `src/app/modules/under-construction/` | No longer in use (placeholder page) |
| `src/app/notfound/` | Duplicate of `page-not-found-page-component/` |

### Backup / Copy Files Inside Active Modules

| File | Reason |
|------|--------|
| `src/app/modules/home/home.component-UC.html` | Old "under construction" HTML backup |
| `src/app/modules/home/home.component-copy-latest.html` | HTML backup copy — not compiled |
| `src/app/modules/my-bookings/my-bookings-copy.ts` | Backup TypeScript file |
| `src/app/modules/my-bookings/my-bookings.component copy.ts` | Another backup TS file |
| `src/app/modules/resorts/rooms.zip` | ZIP archive committed to source — never needed |

### Unused / Stale Assets

| File | Reason |
|------|--------|
| `src/assets/json/rooms copy.json` | Duplicate of `rooms.json` |
| `src/assets/json/rooms.json` | Should be fetched from backend API, not bundled |
| `src/assets/json/tents.json` | Should be fetched from backend API, not bundled |
| `src/payment-redirect.html` | Investigate if this is still needed; if payment flow is API-driven, this is dead |

### Empty / Auto-generated Spec Files (No Tests Written)
All `*.spec.ts` files contain only boilerplate `it('should create', ...)`. Either write real tests or remove them. They add bundle overhead and clutter CI output.

```
src/app/**/*.spec.ts  (54 files — all empty boilerplate)
src/app/auth.service.spec.ts
src/app/user.service.spec.ts
src/app/email-verify.service.spec.ts
src/app/env.service.spec.ts
src/app/gallery.service.spec.ts
src/app/search.service.spec.ts
src/app/can-deactivate-guard.service.spec.ts
```

---

## 🔒 SECURITY ISSUES

### HIGH — Hardcoded External API URL in Source Code
**File:** `src/app/auth.service.ts:12`
```ts
// ❌ CURRENT: hardcoded third-party URL
private apiCommonUrl = 'https://www.zohoapis.com/creator/custom/vanavihari';
```
**Fix:** Move to `environment.ts` / `environment.prod.ts`. Never hardcode external API URLs.

---

### HIGH — JWT / Auth Token Stored in Plain `localStorage`
**File:** `src/app/auth.service.ts`
```ts
localStorage.setItem('access_token', token);  // ❌ visible to XSS attacks
```
**Fix:** Use `HttpOnly` cookies (server-side) or store token in memory with a refresh cookie. At minimum, use `sessionStorage` for the token with a short expiry.

---

### MEDIUM — All Booking State in Unencrypted `localStorage`
Sensitive data like `booking_rooms`, `extra_guests`, `noof_guests`, `summaryData`, `room_data`, `search_data` is stored in localStorage as plain JSON. Any browser extension or XSS vector can read it.

**Fix:** Minimise localStorage usage. Ephemeral data should live in a service (in-memory) or be re-fetched from the backend.

---

### MEDIUM — `console.log` Statements in Production Code (30+)
These leak internal data structures, user objects, and payment flow details to the browser console in production.

**Files with `console.log` to clean:**
- `resorts/vanavihari-maredumilli/vanavihari-maredumilli.component.ts` (lines 69, 494)
- `resorts/jungle-star-valamuru/jungle-star-valamuru.component.ts` (line 69)
- `tourist-spots-booking/tourist-spots-booking.component.ts` (lines 754, 797)
- `tourist-spots-checkout/tourist-spots-checkout.component.ts` (lines 320, 378) **⚠️ payment data**
- `booking-summary/booking-summary.component.ts` (lines 753, 832) **⚠️ payment data**
- `tent-checkout/tent-checkout.component.ts` (lines 364, 422) **⚠️ payment data**
- `my-bookings/my-bookings.component.ts` (lines 313, 314, 330, 350)
- `cancel-request/cancel-request.component.ts` (lines 110, 162, 163, 168)
- `cancel-status/cancel-status.component.ts` (line 30)

**Fix:** Replace with environment-gated logging:
```ts
if (!environment.production) console.log(...);
```

---

### LOW — Unused Zoho `sendDataToServer` Method
**File:** `src/app/auth.service.ts:33-38`
The `sendDataToServer` method calls a Zoho API directly from the frontend — this bypasses your backend. If no longer used, delete it. If still needed, proxy it through your Node.js backend.

---

## 📦 STATIC DATA THAT SHOULD BE DYNAMIC (Backend-Driven)

### Pages with hardcoded content arrays that should be API calls:

| Component | Static Data | Action |
|-----------|------------|--------|
| `home.component.ts` + `home.data.ts` | Resort cards, trek trails, "how to reach" modals | Create `/api/home/content` backend endpoint |
| `tourist-places.component.ts` | Trek data with prices, descriptions, images | Create `/api/treks` endpoint |
| `gallery.service.ts` (9.9 KB!) | Entire gallery image arrays hardcoded | Create `/api/gallery` endpoint |
| `vanavihari-maredumilli.component.ts` | Resort info, amenities, room types | Already partly dynamic; remove static fallbacks |
| `jungle-star-valamuru.component.ts` | Same as above for Jungle Star | Same fix |
| `food-menu.component` | Food items, prices, categories | Create `/api/food-menu` endpoint |
| `tribal-community.component` | Community info, images | Create `/api/content/tribal` endpoint |
| `about-vanavihari.component` | Organization content, history | Create `/api/content/about` endpoint |
| `awards-news-publications.component` | Awards list, news items | Create `/api/content/awards` endpoint |
| `bio-diversity-zone.component` | Zone info, species list | Create `/api/content/biodiversity` endpoint |

### Local JSON Files in `assets/` (must move to backend)
```
src/assets/json/rooms.json   → GET /api/rooms
src/assets/json/tents.json   → GET /api/tents
```

---

## 🧩 GLOBAL COMPONENTS TO CREATE

These patterns repeat across 5+ components and should be extracted:

### Missing Global Components

| Component | Used In | Priority |
|-----------|---------|----------|
| `<app-page-banner>` | Every page has a banner with title + breadcrumb | 🔴 High |
| `<app-section-header>` | Section titles (h2 + underline + subtitle) repeat | 🔴 High |
| `<app-empty-state>` | "No bookings found", "No rooms available" states | 🟠 Medium |
| `<app-booking-card>` | Booking summary cards in `my-bookings` + `booking-summary` | 🟠 Medium |
| `<app-resort-card>` | Resort listing cards | 🟠 Medium |
| `<app-price-tag>` | Price display with currency formatting | 🟡 Low |

### Missing Global Services

| Service | Purpose |
|---------|---------|
| `ToastService` | Currently calling `MatSnackBar` directly in every component; centralise |
| `ApiService` | All HTTP calls are in components; extract to services |
| `BookingStateService` | Replace localStorage booking state with an in-memory service |

---

## 🎨 GLOBAL STYLING ISSUES

### Inline Styles (Should be in SCSS)
Many components use `style="..."` inline attributes for common values:
```html
<!-- Found in multiple components -->
<span style="font-size: 0.7rem; letter-spacing: 1px">...</span>
<div style="max-height: 40px">...</div>
<h3 style="line-height: 1.2; font-size: 0.9rem">...</h3>
```
**Fix:** Define utility classes in `src/styles.scss` or create `src/scss/_utilities.scss`.

### Duplicate SCSS Variables
Each component re-declares:
```scss
$theme-color: #2c3e50;   // in settings.component.scss
$primary: #2c6b3e;       // in layout.component.scss
$green: #3a8f5a;         // in home.component.scss
```
**Fix:** Create `src/scss/_variables.scss` and import it globally. All theme colours are defined once.

### Per-component `::ng-deep` overrides for Angular Material
`::ng-deep` hacks appear in `settings`, `home`, and at least 4 other components.
**Fix:** Move all Material theme overrides to a single `src/scss/_material-overrides.scss`.

### Missing `src/scss/` structure (only partially implemented)
The `src/scss/` folder exists but components don't import from it.
**Recommended structure:**
```
src/scss/
  _variables.scss    ← all colours, fonts, spacing tokens
  _mixins.scss       ← reusable mixins (e.g. responsive, card)
  _material.scss     ← all ::ng-deep Material overrides
  _utilities.scss    ← helper classes
  _animations.scss   ← keyframes
```

---

## 📁 SERVICE FILE ORGANISATION ISSUES

Root-level service files should move into `src/app/services/`:

| Current Location | Move To |
|-----------------|---------|
| `src/app/auth.service.ts` | `src/app/services/auth.service.ts` |
| `src/app/user.service.ts` | `src/app/services/user.service.ts` |
| `src/app/gallery.service.ts` | `src/app/services/gallery.service.ts` |
| `src/app/search.service.ts` | `src/app/services/search.service.ts` |
| `src/app/email-verify.service.ts` | `src/app/services/email-verify.service.ts` |
| `src/app/env.service.ts` | `src/app/services/env.service.ts` |
| `src/app/shared.service.ts` | `src/app/services/shared.service.ts` |
| `src/app/tent.service.ts` | `src/app/services/tent.service.ts` (also check if empty!) |

---

## 📋 PRIORITISED ACTION PLAN

### 🔴 Do Now (Security + Correctness)
- [ ] Remove all `console.log` from payment-related components
- [ ] Move `access_token` out of localStorage (use `sessionStorage` + in-memory service minimum)
- [ ] Move Zoho URL to `environment.ts`
- [ ] Delete duplicate/backup files listed above

### 🟠 Do Soon (Code Quality)
- [ ] Move `rooms.json` and `tents.json` logic to backend API endpoints
- [ ] Delete empty `.spec.ts` files or write real tests
- [ ] Create `<app-page-banner>` global component
- [ ] Create `<app-section-header>` global component
- [ ] Create `_variables.scss` and `_material-overrides.scss`
- [ ] Move all services into `src/app/services/`

### 🟡 Do Later (Architecture)
- [ ] Extract `gallery.service.ts` hardcoded arrays into backend `/api/gallery`
- [ ] Create `ToastService` wrapper around `MatSnackBar`
- [ ] Create `ApiService` to centralise all HTTP calls
- [ ] Replace localStorage booking state with `BookingStateService`
- [ ] Audit `home.data.ts` and move to a backend CMS endpoint

---

*Total estimated files to delete: ~80+ (backup files, spec files, duplicate modules)*
*Total estimated new files to create: ~12 (global components, services, SCSS partials)*
