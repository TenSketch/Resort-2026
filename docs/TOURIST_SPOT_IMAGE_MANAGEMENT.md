# Tourist Spot Image Management Implementation

## Overview
Implemented image upload and deletion functionality for Tourist Spots, matching the pattern used in the Rooms component.

## Changes Made

### Frontend Changes

#### 1. `admin/src/components/touristSpot/TouristSpotDetailPanel.tsx`
- **Updated image interface**: Changed from `Array<string | { url?: string }>` to `Array<{ url: string; public_id: string }>` to match Cloudinary format
- **Removed `keptImages` state**: No longer needed since we use individual image deletion
- **Added `deletingImage` state**: Tracks which image is being deleted (for loading state)
- **Added `handleDeleteImage` function**: Deletes individual images via API call to `/api/touristspots/:id/images/:publicId`
- **Updated image display section**: 
  - Shows existing images in a grid
  - Each image has a delete button (visible on hover) when in edit mode
  - Shows loading spinner while deleting
  - Upload new images section below existing images
  - Preview of newly selected images before upload
- **Simplified save logic**: 
  - Uses FormData only when new images are uploaded
  - Uses JSON for text-only updates
  - No longer sends `retainedImages` - deletion is handled separately

#### 2. `admin/src/components/touristSpot/AllTouristSpots.tsx`
- **Updated interface**: Changed images type to match new format
- **Simplified image mapping**: No longer converts string URLs to objects
- **Updated thumbnail rendering**: Directly accesses `data[0].url` instead of checking for string/object

### Backend Changes

#### 1. `backend/controllers/touristSpotController.js`
- **Added `deleteTouristSpotImage` function**:
  - Accepts `id` (tourist spot ID) and `publicId` (Cloudinary public_id)
  - Finds the image in the spot's images array
  - Deletes from Cloudinary using `cloudinary.uploader.destroy()`
  - Removes from database array
  - Returns updated tourist spot
- **Simplified `updateTouristSpot` function**:
  - Removed `retainedImages` logic
  - New images are simply appended to existing images array
  - Individual deletion is handled by separate endpoint

#### 2. `backend/routes/touristSpotRoutes.js`
- **Added new route**: `DELETE /api/touristspots/:id/images/:publicId`
- **Requires permission**: `canEdit`
- **Placed before** the general delete route to avoid route conflicts

## API Endpoints

### Delete Individual Image
```
DELETE /api/touristspots/:id/images/:publicId
Authorization: Bearer <admin_token>
Permission: canEdit

Response:
{
  "touristSpot": {
    "_id": "...",
    "name": "...",
    "images": [...] // Updated images array
  }
}
```

### Update Tourist Spot (with new images)
```
PUT /api/touristspots/:id
Authorization: Bearer <admin_token>
Permission: canEdit
Content-Type: multipart/form-data

Body:
- images: File[] (new images to upload)
- name: string
- category: string
- entryFees: number
- parking2W: number
- parking4W: number
- cameraFees: number
- description: string
- address: string
- mapEmbed: string

Response:
{
  "touristSpot": {
    "_id": "...",
    "images": [...] // Includes both existing and newly uploaded images
  }
}
```

## User Flow

### Viewing Images
1. Click on any tourist spot row in the table
2. Detail panel opens showing all images in a grid
3. First image is also shown as hero image at the top

### Editing Images

#### Deleting Images
1. Click "Edit" button in detail panel
2. Hover over any image to reveal delete button (X icon)
3. Click delete button
4. Confirm deletion
5. Image is removed from Cloudinary and database
6. UI updates immediately

#### Adding Images
1. Click "Edit" button in detail panel
2. Scroll to "Images" section
3. Click file input to select new images (multiple selection supported)
4. Preview of selected images appears
5. Click "Save" to upload
6. New images are appended to existing images
7. Success message appears

## Error Handling

- **Permission denied**: Shows error if user lacks `canEdit` permission
- **Image not found**: Returns 404 if image public_id doesn't exist
- **Cloudinary failure**: Continues with database removal even if Cloudinary deletion fails
- **Network errors**: Shows user-friendly error messages

## Benefits of This Approach

1. **Consistent with Rooms**: Same pattern used across the application
2. **Better UX**: Individual image deletion without affecting others
3. **Efficient**: Only uploads new images, doesn't re-upload existing ones
4. **Safe**: Separate deletion endpoint prevents accidental bulk deletions
5. **Clear feedback**: Loading states and success/error messages

## Testing Checklist

- [ ] View tourist spot with multiple images
- [ ] Delete individual images in edit mode
- [ ] Upload new images (single and multiple)
- [ ] Save without changing images (JSON update)
- [ ] Save with new images (FormData update)
- [ ] Verify Cloudinary images are deleted
- [ ] Test permission restrictions
- [ ] Test error scenarios (network failure, invalid ID)
