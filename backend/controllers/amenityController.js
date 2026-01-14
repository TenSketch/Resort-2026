import Amenity from '../models/amenityModel.js'

const createAmenity = async (req, res) => {
  try {
    const { name, description, isActive } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Amenity name is required' })

    const amenity = new Amenity({
      name: String(name).trim(),
      description: description ? String(description).trim() : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    })

    await amenity.save()
    return res.status(201).json({ amenity })
  } catch (error) {
    console.error('createAmenity error', error)
    return res.status(500).json({ error: error.message || 'Server error' })
  }
}

const listAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find().sort({ createdAt: -1 })
    res.json({ amenities })
  } catch (error) {
    console.error('listAmenities error', error)
    res.status(500).json({ error: error.message || 'Server error' })
  }
}

// Update only isActive status of an amenity
const updateAmenityStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body || {}
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive boolean required' })

    const amenity = await Amenity.findByIdAndUpdate(id, { isActive }, { new: true })
    if (!amenity) return res.status(404).json({ error: 'Amenity not found' })
    res.json({ amenity })
  } catch (error) {
    console.error('updateAmenityStatus error', error)
    res.status(500).json({ error: error.message || 'Server error' })
  }
}

// Update amenity (name, description, optional isActive)
const updateAmenity = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, isActive } = req.body || {}
    const update = {}
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty' })
      update.name = String(name).trim()
    }
    if (description !== undefined) {
      update.description = String(description).trim()
    }
    if (typeof isActive === 'boolean') {
      update.isActive = isActive
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'No valid fields to update' })
    const amenity = await Amenity.findByIdAndUpdate(id, update, { new: true })
    if (!amenity) return res.status(404).json({ error: 'Amenity not found' })
    res.json({ amenity })
  } catch (error) {
    console.error('updateAmenity error', error)
    res.status(500).json({ error: error.message || 'Server error' })
  }
}

export { createAmenity, listAmenities, updateAmenityStatus, updateAmenity }
