import TentType from '../models/tentTypeModel.js';

// Create a new tent type
export const createTentType = async (req, res) => {
  try {
    const {
      tentType,
      accommodationType,
      tentBase,
      dimensions,
      brand,
      features,
      pricePerDay,
      amenities,
    } = req.body;

    // Validation
    if (!tentType || !accommodationType || !tentBase || !pricePerDay) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tent type, accommodation type, tent base, and price are required' 
      });
    }

    const newTentType = new TentType({
      tentType,
      accommodationType,
      tentBase,
      dimensions: dimensions || "",
      brand: brand || "",
      features: features || "",
      pricePerDay: Number(pricePerDay),
      amenities: Array.isArray(amenities) ? amenities : [],
    });

    await newTentType.save();

    res.status(201).json({
      success: true,
      message: 'Tent type created successfully',
      tentType: newTentType,
    });
  } catch (error) {
    console.error('Error creating tent type:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create tent type' 
    });
  }
};

// Get all tent types
export const getAllTentTypes = async (req, res) => {
  try {
    const tentTypes = await TentType.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      tentTypes,
    });
  } catch (error) {
    console.error('Error fetching tent types:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tent types' 
    });
  }
};

// Get a single tent type by ID
export const getTentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const tentType = await TentType.findById(id);

    if (!tentType) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent type not found' 
      });
    }

    res.status(200).json({
      success: true,
      tentType,
    });
  } catch (error) {
    console.error('Error fetching tent type:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch tent type' 
    });
  }
};

// Update a tent type
export const updateTentType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tentType = await TentType.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!tentType) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent type not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent type updated successfully',
      tentType,
    });
  } catch (error) {
    console.error('Error updating tent type:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update tent type' 
    });
  }
};

// Toggle tent type status (activate/deactivate)
export const toggleTentTypeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const tentType = await TentType.findById(id);

    if (!tentType) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent type not found' 
      });
    }

    tentType.isDisabled = !tentType.isDisabled;
    await tentType.save();

    res.status(200).json({
      success: true,
      message: `Tent type ${tentType.isDisabled ? 'deactivated' : 'activated'} successfully`,
      tentType,
    });
  } catch (error) {
    console.error('Error toggling tent type status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to toggle tent type status' 
    });
  }
};

// Delete a tent type (hard delete)
export const deleteTentType = async (req, res) => {
  try {
    const { id } = req.params;
    const tentType = await TentType.findByIdAndDelete(id);

    if (!tentType) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tent type not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent type deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tent type:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete tent type' 
    });
  }
};
