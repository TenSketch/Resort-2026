import Tent from '../models/tentModel.js';
import TentSpot from '../models/tentSpotModel.js';
import TentType from '../models/tentTypeModel.js';
import cloudinary from '../config/cloudinaryConfig.js';
import fs from 'fs';
import { promisify } from 'util';
const unlinkAsync = promisify(fs.unlink);

// Create a new tent
export const createTent = async (req, res) => {
  try {
    const {
      tentSpot,
      tentType,
      noOfGuests,
      noOfChildren,
      rate,
      tentCount,
    } = req.body;

    // Validation
    if (!tentSpot || !tentType || !noOfGuests || !rate) {
      return res.status(400).json({ 
        success: false, 
        error: 'All required fields must be provided' 
      });
    }

    // Verify tent spot exists
    const spotExists = await TentSpot.findById(tentSpot);
    if (!spotExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    // Verify tent type exists
    const typeExists = await TentType.findById(tentType);
    if (!typeExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent type not found' 
      });
    }

    // Auto-generate tent ID based on tent spot prefix
    const prefix = spotExists.tentIdPrefix || 'T';
    
    // Find the last tent with this prefix
    const lastTent = await Tent.findOne({ 
      tentId: new RegExp(`^${prefix}-T-\\d+$`),
      tentSpot: tentSpot
    }).sort({ createdAt: -1 });
    
    let nextNumber = 1;
    if (lastTent && lastTent.tentId) {
      const match = lastTent.tentId.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    const tentId = `${prefix}-T-${String(nextNumber).padStart(2, '0')}`;
    
    // Check if tentId already exists (safety check)
    const existingTent = await Tent.findOne({ tentId });
    if (existingTent) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tent ID already exists. Please try again.' 
      });
    }

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Upload from buffer (memory storage) or file path (disk storage)
          let result;
          if (file.buffer) {
            // Memory storage - upload from buffer
            result = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'vanavihari/tents' },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(file.buffer);
            });
          } else if (file.path) {
            // Disk storage - upload from file path
            result = await cloudinary.uploader.upload(file.path, { 
              folder: 'vanavihari/tents' 
            });
          }
          
          if (result) {
            images.push({ 
              url: result.secure_url, 
              public_id: result.public_id 
            });
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        } finally {
          // Clean up disk file if it exists
          if (file && file.path) {
            try { 
              await unlinkAsync(file.path); 
            } catch (e) { 
              console.warn('cleanup failed', e.message || e); 
            }
          }
        }
      }
    }

    const tent = new Tent({
      tentSpot,
      tentType,
      noOfGuests: Number(noOfGuests),
      noOfChildren: Number(noOfChildren) || 0,
      tentId,
      rate: Number(rate),
      tentCount: Number(tentCount) || 1,
      images,
    });

    await tent.save();

    // Populate references before sending response
    await tent.populate('tentSpot tentType');

    res.status(201).json({
      success: true,
      message: 'Tent created successfully',
      tent,
    });
  } catch (error) {
    console.error('Error creating tent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create tent' 
    });
  }
};

// Get all tents
export const getAllTents = async (req, res) => {
  try {
    const { tentSpotId } = req.query;
    
    const query = tentSpotId ? { tentSpot: tentSpotId, isDisabled: false } : { isDisabled: false };
    
    const tents = await Tent.find(query)
      .populate('tentSpot', 'spotName location')
      .populate('tentType', 'tentType accommodationType')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      tents,
    });
  } catch (error) {
    console.error('Error fetching tents:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tents' 
    });
  }
};

// Get a single tent by ID
export const getTentById = async (req, res) => {
  try {
    const { id } = req.params;
    const tent = await Tent.findById(id)
      .populate('tentSpot', 'spotName location')
      .populate('tentType', 'tentType accommodationType');

    if (!tent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent not found' 
      });
    }

    res.status(200).json({
      success: true,
      tent,
    });
  } catch (error) {
    console.error('Error fetching tent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tent' 
    });
  }
};

// Update a tent
export const updateTent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        try {
          // Upload from buffer (memory storage) or file path (disk storage)
          let result;
          if (file.buffer) {
            // Memory storage - upload from buffer
            result = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'vanavihari/tents' },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(file.buffer);
            });
          } else if (file.path) {
            // Disk storage - upload from file path
            result = await cloudinary.uploader.upload(file.path, { 
              folder: 'vanavihari/tents' 
            });
          }
          
          if (result) {
            newImages.push({ 
              url: result.secure_url, 
              public_id: result.public_id 
            });
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        } finally {
          // Clean up disk file if it exists
          if (file && file.path) {
            try { 
              await unlinkAsync(file.path); 
            } catch (e) { 
              console.warn('cleanup failed', e.message || e); 
            }
          }
        }
      }
      
      // Append new images to existing ones
      const existingTent = await Tent.findById(id);
      if (existingTent) {
        updateData.images = [...existingTent.images, ...newImages];
      } else {
        updateData.images = newImages;
      }
    }

    const tent = await Tent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('tentSpot tentType');

    if (!tent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent updated successfully',
      tent,
    });
  } catch (error) {
    console.error('Error updating tent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update tent' 
    });
  }
};

// Delete an image from a tent
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image public_id is required' 
      });
    }

    const tent = await Tent.findById(id);
    if (!tent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent not found' 
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // Remove from database
    tent.images = tent.images.filter(img => img.public_id !== public_id);
    await tent.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      tent,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete image' 
    });
  }
};

// Toggle tent status (activate/deactivate)
export const toggleTentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const tent = await Tent.findById(id);

    if (!tent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent not found' 
      });
    }

    tent.isDisabled = !tent.isDisabled;
    await tent.save();

    res.status(200).json({
      success: true,
      message: `Tent ${tent.isDisabled ? 'deactivated' : 'activated'} successfully`,
      tent,
    });
  } catch (error) {
    console.error('Error toggling tent status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to toggle tent status' 
    });
  }
};

// Delete a tent (hard delete)
export const deleteTent = async (req, res) => {
  try {
    const { id } = req.params;
    const tent = await Tent.findById(id);

    if (!tent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent not found' 
      });
    }

    // Delete all images from Cloudinary
    for (const image of tent.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
      }
    }

    await Tent.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Tent deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete tent' 
    });
  }
};

// Get next available tent ID for a tent spot
export const getNextTentId = async (req, res) => {
  try {
    const { tentSpotId } = req.params;
    
    if (!tentSpotId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tent spot ID is required' 
      });
    }

    // Fetch tent spot to get prefix
    const tentSpot = await TentSpot.findById(tentSpotId);
    if (!tentSpot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    if (!tentSpot.tentIdPrefix) {
      return res.json({ 
        success: true, 
        nextTentId: '' 
      });
    }

    const prefix = tentSpot.tentIdPrefix;
    
    // Find the last tent with this prefix
    const lastTent = await Tent.findOne({ 
      tentId: new RegExp(`^${prefix}-T-\\d+$`),
      tentSpot: tentSpotId
    }).sort({ createdAt: -1 });
    
    let nextNumber = 1;
    if (lastTent && lastTent.tentId) {
      const match = lastTent.tentId.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    const nextTentId = `${prefix}-T-${String(nextNumber).padStart(2, '0')}`;
    
    res.json({ 
      success: true, 
      nextTentId, 
      prefix 
    });
  } catch (error) {
    console.error('Error getting next tent ID:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get next tent ID' 
    });
  }
};

// Get available tents for a tent spot and date range
export const getAvailableTents = async (req, res) => {
  try {
    const { tentSpotId, checkinDate, checkoutDate } = req.query;
    
    if (!tentSpotId || !checkinDate || !checkoutDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tent spot ID, check-in date, and check-out date are required' 
      });
    }

    // Import TentReservation model
    const TentReservation = (await import('../models/tentReservationModel.js')).default;

    // Find all tents for this tent spot
    const allTents = await Tent.find({ 
      tentSpot: tentSpotId, 
      isDisabled: false 
    })
      .populate('tentSpot', 'spotName location')
      .populate('tentType', 'tentType accommodationType brand tentBase amenities')
      .sort({ createdAt: -1 });

    // Find all tent reservations that overlap with the requested dates
    const overlappingReservations = await TentReservation.find({
      tentSpot: tentSpotId,
      status: { $in: ['Pending', 'confirmed'] },
      $or: [
        {
          // Reservation starts during the requested period
          checkinDate: { $gte: new Date(checkinDate), $lt: new Date(checkoutDate) }
        },
        {
          // Reservation ends during the requested period
          checkoutDate: { $gt: new Date(checkinDate), $lte: new Date(checkoutDate) }
        },
        {
          // Reservation spans the entire requested period
          checkinDate: { $lte: new Date(checkinDate) },
          checkoutDate: { $gte: new Date(checkoutDate) }
        }
      ]
    }).select('tents');

    // Count bookings per tent
    const tentBookingCount = {};
    overlappingReservations.forEach(reservation => {
      reservation.tents.forEach(tentId => {
        const id = tentId.toString();
        tentBookingCount[id] = (tentBookingCount[id] || 0) + 1;
      });
    });

    // Filter tents based on tentCount (available slots)
    const availableTents = allTents.filter(tent => {
      const currentBookings = tentBookingCount[tent._id.toString()] || 0;
      const maxBookings = tent.tentCount || 1;
      return currentBookings < maxBookings;
    });

    // Add availability info to each tent
    const tentsWithAvailability = availableTents.map(tent => {
      const tentObj = tent.toObject();
      const currentBookings = tentBookingCount[tent._id.toString()] || 0;
      const maxBookings = tent.tentCount || 1;
      tentObj.availableSlots = maxBookings - currentBookings;
      tentObj.totalSlots = maxBookings;
      return tentObj;
    });

    res.status(200).json({
      success: true,
      tents: tentsWithAvailability,
      totalTents: allTents.length,
      availableCount: availableTents.length,
      bookedCount: allTents.length - availableTents.length
    });
  } catch (error) {
    console.error('Error fetching available tents:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch available tents' 
    });
  }
};
