import TentSpot from '../models/tentSpotModel.js';

// Create a new tent spot
export const createTentSpot = async (req, res) => {
  try {
    const {
      spotName,
      tentIdPrefix,
      location,
      slugUrl,
      contactPerson,
      contactNo,
      email,
      rules,
      accommodation,
      foodAvailable,
      kidsStay,
      womenStay,
      checkIn,
      checkOut,
    } = req.body;

    // Validation
    if (!spotName || !tentIdPrefix || !location || !contactPerson || !contactNo || !email || 
        !accommodation || !foodAvailable || !kidsStay || !womenStay || 
        !checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        error: 'All required fields must be provided' 
      });
    }

    const tentSpot = new TentSpot({
      spotName,
      tentIdPrefix,
      location,
      slugUrl, // Will be auto-generated if not provided
      contactPerson,
      contactNo,
      email,
      rules: rules || "",
      accommodation,
      foodAvailable,
      kidsStay,
      womenStay,
      checkIn,
      checkOut,
    });

    await tentSpot.save();

    res.status(201).json({
      success: true,
      message: 'Tent spot created successfully',
      tentSpot,
    });
  } catch (error) {
    console.error('Error creating tent spot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create tent spot' 
    });
  }
};

// Get all tent spots
export const getAllTentSpots = async (req, res) => {
  try {
    const tentSpots = await TentSpot.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      tentSpots,
    });
  } catch (error) {
    console.error('Error fetching tent spots:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tent spots' 
    });
  }
};

// Get a single tent spot by ID
export const getTentSpotById = async (req, res) => {
  try {
    const { id } = req.params;
    const tentSpot = await TentSpot.findById(id);

    if (!tentSpot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    res.status(200).json({
      success: true,
      tentSpot,
    });
  } catch (error) {
    console.error('Error fetching tent spot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tent spot' 
    });
  }
};

// Get a single tent spot by slug
export const getTentSpotBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tentSpot = await TentSpot.findOne({ slugUrl: slug });

    if (!tentSpot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    res.status(200).json({
      success: true,
      tentSpot,
    });
  } catch (error) {
    console.error('Error fetching tent spot by slug:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tent spot' 
    });
  }
};

// Update a tent spot
export const updateTentSpot = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tentSpot = await TentSpot.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!tentSpot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent spot updated successfully',
      tentSpot,
    });
  } catch (error) {
    console.error('Error updating tent spot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update tent spot' 
    });
  }
};

// Toggle tent spot status (activate/deactivate)
export const toggleTentSpotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const tentSpot = await TentSpot.findById(id);

    if (!tentSpot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    tentSpot.isDisabled = !tentSpot.isDisabled;
    await tentSpot.save();

    res.status(200).json({
      success: true,
      message: `Tent spot ${tentSpot.isDisabled ? 'deactivated' : 'activated'} successfully`,
      tentSpot,
    });
  } catch (error) {
    console.error('Error toggling tent spot status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to toggle tent spot status' 
    });
  }
};

// Delete a tent spot (hard delete)
export const deleteTentSpot = async (req, res) => {
  try {
    const { id } = req.params;
    const tentSpot = await TentSpot.findByIdAndDelete(id);

    if (!tentSpot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent spot not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent spot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tent spot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete tent spot' 
    });
  }
};
