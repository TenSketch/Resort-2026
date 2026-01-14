# Tent Inventory Feature Implementation

## Overview
Complete backend and frontend integration for managing tent inventory in the Vanavihari system with Cloudinary image upload support.

## Backend Implementation

### 1. Model (`backend/models/tentModel.js`)
- **Fields:**
  - tentSpot (ObjectId, ref: TentSpot, required) - Reference to tent spot
  - tentType (ObjectId, ref: TentType, required) - Reference to tent type
  - noOfGuests (Number, required) - Number of guests the tent can accommodate
  - tentId (String, required, unique) - Unique tent identifier
  - rate (Number, required) - Price per day
  - images (Array) - Multiple images with Cloudinary URLs and public_ids
  - isDisabled (Boolean, default: false)
  - timestamps (createdAt, updatedAt)

### 2. Controller (`backend/controllers/tentController.js`)
- **createTent** - Create new tent with multiple image uploads (POST)
- **getAllTents** - Fetch all tents with populated references (GET)
- **getTentById** - Fetch single tent (GET)
- **updateTent** - Update tent details and add more images (PUT)
- **deleteImage** - Delete specific image from tent (DELETE)
- **toggleTentStatus** - Activate/deactivate tent (PATCH)
- **deleteTent** - Delete tent and all its images from Cloudinary (DELETE)

### 3. Routes (`backend/routes/tentRoutes.js`)
- `GET /api/tents` - Get all tents (public)
- `GET /api/tents/:id` - Get single tent (public)
- `POST /api/tents` - Create tent with images (admin auth required, supports up to 10 images)
- `PUT /api/tents/:id` - Update tent (admin auth required)
- `DELETE /api/tents/:id/image` - Delete specific image (admin auth required)
- `PATCH /api/tents/:id/toggle-status` - Toggle status (admin auth required)
- `DELETE /api/tents/:id` - Delete tent (admin auth required)

### 4. Integration (`backend/index.js`)
- Added tent router to main application
- Route: `/api/tents`
- Uses multer for handling multipart/form-data
- Uploads images to Cloudinary in 'tents' folder

## Frontend Implementation

### 1. Add Tent Form (`admin/src/components/tentInventory/AddTents.tsx`)
**Features:**
- ✅ **Dynamic Tent Spot Dropdown** - Fetches from `/api/tent-spots`
- ✅ **Dynamic Tent Type Dropdown** - Fetches from `/api/tent-types`
- ✅ **No. of Guests** input field
- ✅ **Tent ID** input field (manual entry)
- ✅ **Rate** auto-filled from selected tent type (editable)
- ✅ **Multiple Image Upload** with:
  - Image preview thumbnails
  - Remove button for each image
  - Support for multiple file selection
- Connected to backend API
- Submits data with FormData for file uploads
- Includes authentication token
- Shows success/error messages

### 2. All Tents Table (`admin/src/components/tentInventory/AllTents.tsx`)
**To be updated:**
- Fetch data from `GET /api/tents`
- Display tent spot name and tent type
- Show image thumbnails
- Edit functionality
- Toggle status
- Export to Excel

## Features
✅ Create new tents with validation
✅ Dynamic tent spot dropdown (from database)
✅ Dynamic tent type dropdown (from database)
✅ No. of guests field
✅ Multiple image upload to Cloudinary
✅ Image preview with remove option
✅ Auto-fill rate from tent type
✅ Unique tent ID validation
✅ Permission-based access control
✅ Real-time data synchronization
✅ Error handling and user feedback

## Image Upload
- **Storage**: Cloudinary
- **Folder**: tents
- **Max Images**: 10 per tent
- **Supported Formats**: JPG, PNG, etc.
- **Features**:
  - Multiple file selection
  - Preview before upload
  - Remove individual images
  - Automatic cleanup on delete

## API Testing
You can test the API using tools like Postman:

1. **Create Tent:**
   ```
   POST http://localhost:5000/api/tents
   Headers: { "Authorization": "Bearer your-admin-token" }
   Body: FormData
     - tentSpot: "tent_spot_id"
     - tentType: "tent_type_id"
     - noOfGuests: 4
     - tentId: "V-T4-01"
     - rate: 3500
     - images: [file1, file2, ...]
   ```

2. **Get All Tents:**
   ```
   GET http://localhost:5000/api/tents
   ```

3. **Update Tent:**
   ```
   PUT http://localhost:5000/api/tents/:id
   Headers: { "Authorization": "Bearer your-admin-token" }
   Body: FormData (same as create)
   ```

4. **Delete Image:**
   ```
   DELETE http://localhost:5000/api/tents/:id/image
   Headers: { "Authorization": "Bearer your-admin-token", "Content-Type": "application/json" }
   Body: { "public_id": "cloudinary_public_id" }
   ```

5. **Toggle Status:**
   ```
   PATCH http://localhost:5000/api/tents/:id/toggle-status
   Headers: { "Authorization": "Bearer your-admin-token" }
   ```

## Environment Variables Required
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Next Steps
- Update AllTents table to fetch from backend
- Add image gallery view in detail sheet
- Test complete flow from form submission to table display
- Verify image upload and deletion
- Test permission-based access control
