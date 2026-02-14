# Trek Booking Calculation Logic Analysis

## Current Implementation

### Frontend Calculation Logic:

```javascript
selectedSpots.forEach((spot) => {
  totalEntry += guests * (spot.entryFees || 0);
  totalCamera += cameras * (spot.cameraFees || 0);
  avgGuestRate += (spot.entryFees || 0);
  avgCameraRate += (spot.cameraFees || 0);
});

avgGuestRate = avgGuestRate / selectedSpots.length;
avgCameraRate = avgCameraRate / selectedSpots.length;
```

### What This Does:

**It ADDS the fees for each trek spot separately.**

---

## Example Calculation

### Scenario:
- **Selected Trek Spots**: 2 spots
  - Spot 1: Entry ₹350, Camera ₹100
  - Spot 2: Entry ₹425, Camera ₹100
- **Guests**: 2
- **Cameras**: 2

### Current Calculation:

**Entry Fees:**
- Spot 1: 2 guests × ₹350 = ₹700
- Spot 2: 2 guests × ₹425 = ₹850
- **Total Entry = ₹1,550**

**Camera Fees:**
- Spot 1: 2 cameras × ₹100 = ₹200
- Spot 2: 2 cameras × ₹100 = ₹200
- **Total Camera = ₹400**

**Grand Total = ₹1,950**

**Display Breakdown:**
- Per Guest Rate = (₹350 + ₹425) / 2 = ₹387.50 (average)
- Per Camera Rate = (₹100 + ₹100) / 2 = ₹100 (average)
- Shows: "2 Guests × ₹387.50 = ₹1,550"
- Shows: "2 Cameras × ₹100 = ₹400"

---

## Backend Calculation Logic:

```javascript
const touristSpots = spots.map(spot => {
    const entryAmount = guests * (spot.entryFees || 0);
    const cameraAmount = cameras * (spot.cameraFees || 0);
    const spotTotal = entryAmount + cameraAmount;
    totalPayable += spotTotal;
    
    return {
        spotId: spot._id.toString(),
        name: spot.name,
        counts: { guests, cameras },
        amounts: {
            entry: entryAmount,
            camera: cameraAmount,
            total: spotTotal
        }
    };
});
```

**Backend also ADDS fees for each spot.**

---

## Is This Correct?

### ✅ YES - If the business model is:

**"Separate Trek Spot Visits"**
- Customer is booking visits to multiple trek spots
- Each trek spot is a separate visit/entry
- Customer pays entry fee for EACH spot they visit
- Makes sense for: Multi-day trips, different locations

**Example Use Case:**
- Day 1: Visit Rampa Falls (₹700 entry + ₹200 camera)
- Day 2: Visit Maredumilli Waterfalls (₹850 entry + ₹200 camera)
- Total: ₹1,950 (correct!)

---

### ❌ NO - If the business model is:

**"Package Deal / Combo Ticket"**
- Customer is booking a package that includes multiple spots
- They should only pay ONCE, not per spot
- Common for: Same-day multi-spot tours, combo packages

**Example Use Case:**
- "2-Spot Trek Package" - Visit both spots in one day
- Should charge: Highest spot fee OR fixed package rate
- Current calculation would overcharge

---

## Recommended Solutions

### If Current Logic is WRONG (Package Model):

#### Option 1: Charge Highest Spot Fee
```javascript
// Find the spot with highest fees
const maxEntryFee = Math.max(...selectedSpots.map(s => s.entryFees || 0));
const maxCameraFee = Math.max(...selectedSpots.map(s => s.cameraFees || 0));

totalEntry = guests * maxEntryFee;
totalCamera = cameras * maxCameraFee;
```

#### Option 2: Fixed Package Rate
```javascript
// Define package rates
const packageRates = {
  entry: 500,  // Fixed rate for any number of spots
  camera: 150
};

totalEntry = guests * packageRates.entry;
totalCamera = cameras * packageRates.camera;
```

#### Option 3: Discount for Multiple Spots
```javascript
// Apply discount for multiple spots
selectedSpots.forEach((spot) => {
  totalEntry += guests * (spot.entryFees || 0);
  totalCamera += cameras * (spot.cameraFees || 0);
});

// Apply 20% discount if 2+ spots selected
if (selectedSpots.length >= 2) {
  totalEntry *= 0.8;
  totalCamera *= 0.8;
}
```

---

## What You Need to Decide:

### Question 1: When a customer selects 2 trek spots, are they:
- [ ] A) Booking separate visits to each spot (pay for each)
- [ ] B) Booking a package/combo (pay once)
- [ ] C) Getting a discount for multiple spots

### Question 2: If they visit 2 spots on the same day with the same group:
- [ ] A) They should pay full price for each spot
- [ ] B) They should pay only the highest spot's price
- [ ] C) They should get a discounted package rate

### Question 3: Looking at your screenshot showing ₹3,700 total:
- Is this the correct amount for 2 guests, 2 cameras, 2 trek spots?
- Or should it be different?

---

## Current Behavior Summary:

✅ **Frontend**: Adds fees for all selected spots
✅ **Backend**: Adds fees for all selected spots
✅ **Consistent**: Both calculate the same way
❓ **Correct**: Depends on your business model

---

## Action Required:

**Please confirm:**
1. What is the correct business logic for multiple trek spots?
2. Should customers pay separately for each spot, or is it a package deal?
3. Looking at the screenshot, is ₹3,700 the correct total?

Once confirmed, I can update the calculation logic if needed.
