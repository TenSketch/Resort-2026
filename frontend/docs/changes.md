Phase 1 is now implemented in frontend (no backend/API contract changes), and build passes.

**What I changed**

- Home “Choose your experience” trek options now show location labels:
  - [search-resort.component.ts](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/shared/search-resort/search-resort.component.ts:37)
  - [search-resort.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/shared/search-resort/search-resort.component.html:78)

- Cancel flow fixed: extra text field shows only when reason is `Other`, with conditional validation.
  - [cancel-request.component.ts](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/cancel-request/cancel-request.component.ts:53)
  - [cancel-request.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/cancel-request/cancel-request.component.html:20)

- Account save confirmation made explicit with an in-page success alert after save.
  - [settings.component.ts](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/settings/settings.component.ts:289)
  - [settings.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/settings/settings.component.html:29)

- Trek fee display fixed to show **rate** (not total) in booking summary and checkout details:
  - Entry fee shown as `₹X / person`
  - Camera fee shown as `₹X / camera`
  - [tourist-spots-booking.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/tourist-spots-booking/tourist-spots-booking.component.html:123)
  - [tourist-spots-checkout.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/tourist-spots-checkout/tourist-spots-checkout.component.html:43)

- Top navbar alignment/logo consistency improved:
  - normalized side-logo dimensions
  - subtle top/bottom nav padding
  - [layout.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/layout/layout.component.html:2)
  - [layout.component.scss](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/layout/layout.component.scss:236)

- Footer resort link added/fixed to go to working resort booking path:
  - [layout.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/layout/layout.component.html:248)

- Repeated page reloading behavior removed from resort navigation handlers (likely cause of “loads again second time”):
  - [layout.component.ts](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/layout/layout.component.ts:217)

- Contact page missing image fixed (invalid path replaced with existing asset):
  - [contact-us.component.html](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/contact-us/contact-us.component.html:10)

- Minor cleanup: unsubscribed layout subscription on destroy:
  - [layout.component.ts](/home/bala/Desktop/WEBSITE%20PROJECTS/Resort-2026/frontend/src/app/modules/layout/layout.component.ts:86)

**Validation**

- Ran production build successfully: `cd frontend && npm run build`
- One pre-existing CSS warning remains (autoprefixer `align-items: start` suggestion), no build failure.

**Notes**

- I noticed unrelated pre-existing workspace changes (`frontend/package.json`, `frontend/package-lock.json`, root `package-lock.json`, and deleted asset) and did not modify/revert them.

If you want, I’ll start Phase 2 next (global font + green primary palette + reusable button/form/link styles + navbar/footer full consistency pa