👉 `frontend-refactor-guidelines.md`

---

```markdown
# 🚀 VANAVIHARI FRONTEND REFACTOR GUIDELINES (NON-BREAKING)

## ⚠️ CORE RULE
- DO NOT change folder structure
- DO NOT break APIs or backend integration
- ONLY improve UI, performance, and maintainability

---

# 🧱 P1 — REUSABLE COMPONENT STANDARDIZATION

## Goal
Reduce duplication across modals, cards, layouts.

### ✅ Actions

#### 1. Create Shared UI Layer
```

/src/app/shared/ui/

```

#### 2. Global Modal Component
- Replace all modals with one reusable wrapper
- Use `<ng-content>` for flexibility

#### 3. Common Card Class
Use `.ui-card` globally instead of multiple designs

#### 4. Section Wrapper
Standardize spacing using `.section` + `.container`

---

# 🎨 P2 — SCSS & LIBRARY CONSISTENCY

## Issues Identified
- Mixed usage of Bootstrap + Material + custom styles
- PostCSS warnings
- Improper @import usage

### ✅ Actions

- Fix:
```

align-items: start → flex-start

```

- Move all `@import` to top of SCSS files

- Standardize:
  - Use ONE primary styling system
  - Avoid mixing Bootstrap layout + custom grid heavily

- Upgrade / Replace:
  - Fancybox → replace with modern alternative (Swiper / lightGallery)

---

# 🎯 P3 — DESIGN SYSTEM CONSISTENCY

## 🚨 Problem
Inconsistent:
- border radius
- button styles
- input heights

---

## ✅ FINAL DESIGN RULES

### Buttons

- Height: 44px
- Border radius: 999px
- Variants:
  - `.btn--primary`
  - `.btn--outline`

### Colors

- Primary: `#2E7D32`
- Hover: `#1B5E20`
- Accent: `#D4AF37`

### Cards

- Border radius: 16px (STRICT)
- Shadow: soft only

### Inputs

- Height: 44px
- Border radius: 10px

---

# 🧭 P4 — SIDEBAR IMPROVEMENT

## Issues
- Takes too much space
- Always expanded

---

## ✅ Solution

### Desktop

- Default: collapsed (70px)
- Icons only
- Expand on hover/click

### Improvements

- Increase logo size (1.5x)
- Center logo in collapsed state

---

# 📱 P5 — MOBILE UX IMPROVEMENT

## Add:

### Bottom Navigation Bar
- Home
- Resorts
- Treks
- Contact

### Sidebar Behavior
- Convert to drawer (hidden by default)
- Open via hamburger

---

# 🗂️ P6 — JSON-DRIVEN CONTENT

## Goal
Enable future CMS integration

### Move static content to:
```

/assets/data/
resorts.json
treks.json
home.json

```

---

# 🧹 P7 — REMOVE UNUSED CODE

## Actions

- Run:
```

npx depcheck

```

- Remove:
  - unused components
  - unused services
  - unused APIs
  - unused images

- Fix missing assets:
```

/assets/img/placeholder-trek.jpg

```

---

# 🧾 P8 — FOOTER IMPROVEMENT

## Structure

- About
- Links
- Contact
- Policies

## Style

- Dark background
- High contrast text
- Clear spacing

---

# ⚡ P9 — BUILD & PERFORMANCE

## Issue
Bundle size too large (~11MB)

### Fix

- Enable production build:
```

ng build --configuration production

```

- Lazy load modules
- Optimize images
- Remove unused libraries

---

## Node Version

Use:
- Node 20 LTS (NOT v23)

---

# 🔁 P10 — DOUBLE LOAD ISSUE

## Problem
Resort loads twice on click

### Fix

Avoid duplicate API calls:

```

if (params['id'] !== currentId) {
loadResort();
}

```

---

# 🔘 P11 — BUTTON STATES

## Primary

- Green background
- White text

## Outline

- Green border
- Transparent background

## States

- Hover → darker shade
- Active → slight scale (0.97)

---

# 🔐 P12 — SECURITY (IMPORTANT)

## Steps

1. Take backup of sensitive data
   - API keys
   - Zoho tokens
   - Firebase configs

2. Move backup to:
```

/secure-config-backup/

```

3. Add to `.gitignore`:
```

secure-config-backup/

```

4. Remove sensitive data from main project

---

## DO NOT:
- Commit secrets to GitHub
- Expose tokens in frontend

---

# 🎬 GSAP (OPTIONAL ENHANCEMENT)

## Install
```

npm install gsap

```

## Use for:
- section entry animations
- card stagger
- hero transitions

---

# 🚀 FINAL GOAL

Transform UI from:

❌ Informational  
➡️  
✅ Conversion-focused booking experience

---

# ✅ PRIORITY ORDER

1. Design consistency (buttons, cards)
2. Sidebar collapse
3. Remove unused code
4. Mobile UX improvements
5. Bundle optimization

---

# END
```


