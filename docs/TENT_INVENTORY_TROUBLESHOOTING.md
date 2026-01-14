# Tent Inventory Troubleshooting Guide

## Error: "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"

This error means the API is returning an HTML error page instead of JSON. Common causes:

### 1. Backend Server Not Running
**Solution:** Start the backend server
```bash
cd backend
npm run dev
```

### 2. Wrong API URL
**Check:** Make sure `VITE_API_URL` in your `.env` file points to the correct backend URL
```
VITE_API_URL=http://localhost:5000
```

### 3. Route Not Registered
**Fixed:** The tent routes are now properly registered in `backend/index.js`:
```javascript
import tentRouter from './routes/tentRoutes.js'
app.use('/api/tents', tentRouter)
```

### 4. Model File Missing
**Fixed:** Created `backend/models/tentModel.js` with proper schema

### 5. Controller File Typo
**Fixed:** Removed incorrectly named files:
- ❌ `backend/controllers/tentContoller.js` (typo)
- ✅ `backend/controllers/tentController.js` (correct)

## Files Created/Fixed

### Backend Files:
1. ✅ `backend/models/tentModel.js` - Tent schema with image support
2. ✅ `backend/controllers/tentController.js` - CRUD operations with Cloudinary
3. ✅ `backend/routes/tentRoutes.js` - API routes with multer
4. ✅ `backend/index.js` - Routes registered

### Frontend Files:
1. ✅ `admin/src/components/tentInventory/AddTents.tsx` - Form with image upload
2. ⏳ `admin/src/components/tentInventory/AllTents.tsx` - Needs backend integration

## Testing Steps

### 1. Restart Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
Server started on PORT : 5000
MongoDB connected successfully
```

### 2. Test API Endpoints

**Get All Tents:**
```bash
curl http://localhost:5000/api/tents
```

Expected response:
```json
{
  "success": true,
  "tents": []
}
```

**Get Tent Spots:**
```bash
curl http://localhost:5000/api/tent-spots
```

**Get Tent Types:**
```bash
curl http://localhost:5000/api/tent-types
```

### 3. Test Frontend
1. Open `http://localhost:5173/tentinventory/addtents`
2. Check browser console for errors
3. Verify dropdowns are populated
4. Try submitting a tent with images

## Common Issues

### Issue: Dropdowns are empty
**Cause:** No tent spots or tent types in database
**Solution:** Add tent spots and tent types first

### Issue: Image upload fails
**Cause:** Cloudinary credentials not set
**Solution:** Check `.env` file has:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Issue: "Tent ID already exists"
**Cause:** Duplicate tent ID
**Solution:** Use a unique tent ID for each tent

### Issue: 401 Unauthorized
**Cause:** Not logged in as admin
**Solution:** Login with admin credentials first

## Verification Checklist

- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] Tent spots exist in database
- [ ] Tent types exist in database
- [ ] Cloudinary credentials are set
- [ ] Admin is logged in
- [ ] API returns JSON (not HTML)
- [ ] Dropdowns are populated
- [ ] Images can be selected
- [ ] Form submits successfully

## Next Steps

Once the tent creation works:
1. Update AllTents table to fetch from backend
2. Add edit functionality
3. Add image gallery view
4. Test complete CRUD operations
