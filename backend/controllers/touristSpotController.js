import TouristSpot from '../models/touristSpotModel.js'
import cloudinary from '../config/cloudinaryConfig.js'
import fs from 'fs'
import { promisify } from 'util'
const unlinkAsync = promisify(fs.unlink)

// slug helpers (same approach as resorts)
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const ensureUniqueSlug = async (slug, excludeId = null) => {
  let uniqueSlug = slug
  let counter = 1
  while (true) {
    const query = { slug: uniqueSlug }
    if (excludeId) query._id = { $ne: excludeId }
    const existing = await TouristSpot.findOne(query)
    if (!existing) break
    uniqueSlug = `${slug}-${counter}`
    counter++
  }
  return uniqueSlug
}

const createTouristSpot = async (req, res) => {
  try {
    const body = req.body || {}
    const v = (k) => {
      const val = body[k]
      if (Array.isArray(val)) return val[0]
      return val
    }

    const name = v('name')
    if (!name) return res.status(400).json({ error: 'Name is required' })

    let slug = v('slug') || generateSlug(name)
    slug = generateSlug(slug)
    slug = await ensureUniqueSlug(slug)

    const spot = new TouristSpot({
      name,
      slug,
      category: v('category'),
      entryFees: v('entryFees') ? Number(v('entryFees')) : undefined,
      parking2W: v('parking2W') ? Number(v('parking2W')) : undefined,
      parking4W: v('parking4W') ? Number(v('parking4W')) : undefined,
      cameraFees: v('cameraFees') ? Number(v('cameraFees')) : undefined,
      description: v('description'),
      address: v('address'),
      mapEmbed: v('mapEmbed'),
      images: [],
    })

    // handle uploaded images (multer)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, { folder: 'vanavihari/tourist-spots' })
          spot.images.push({ url: result.secure_url, public_id: result.public_id })
        } finally {
          if (file.path) {
            try { await unlinkAsync(file.path) } catch (e) { /* silent */ }
          }
        }
      }
    }

    await spot.save()
    res.status(201).json({ touristSpot: spot })
  } catch (error) {
    console.error(error)
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ error: 'Slug already exists. Please use a different slug.' })
    }
    res.status(500).json({ error: error.message })
  }
}

const listTouristSpots = async (req, res) => {
  try {
    const { slug } = req.query
    if (slug) {
      const spot = await TouristSpot.findOne({ slug })
      if (!spot) return res.status(404).json({ error: 'Tourist spot not found' })
      return res.json({ touristSpot: spot })
    }
    const spots = await TouristSpot.find().sort({ createdAt: -1 })
    res.json({ touristSpots: spots })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getTouristSpotById = async (req, res) => {
  try {
    const { id } = req.params
    const spot = await TouristSpot.findById(id)
    if (!spot) return res.status(404).json({ error: 'Tourist spot not found' })
    res.json({ touristSpot: spot })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateTouristSpot = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await TouristSpot.findById(id)
    if (!existing) return res.status(404).json({ error: 'Tourist spot not found' })

    const body = req.body || {}
    const v = (k) => {
      const val = body[k]
      if (Array.isArray(val)) return val[0]
      return val
    }

    const update = {
      name: v('name'),
      category: v('category'),
      entryFees: v('entryFees') ? Number(v('entryFees')) : undefined,
      parking2W: v('parking2W') ? Number(v('parking2W')) : undefined,
      parking4W: v('parking4W') ? Number(v('parking4W')) : undefined,
      cameraFees: v('cameraFees') ? Number(v('cameraFees')) : undefined,
      description: v('description'),
      address: v('address'),
      mapEmbed: v('mapEmbed'),
    }

    const slugInput = v('slug')
    if (slugInput) {
      let newSlug = generateSlug(slugInput)
      if (newSlug !== existing.slug) newSlug = await ensureUniqueSlug(newSlug, id)
      update.slug = newSlug
    }

    // Handle retained images
    let finalImages = existing.images || []
    if (body.retainedImages) {
      try {
        const retained = JSON.parse(body.retainedImages)
        // Identify images to delete
        const toDelete = finalImages.filter(img => !retained.some(r => r.public_id === img.public_id))
        for (const img of toDelete) {
          if (img.public_id) {
             try { await cloudinary.uploader.destroy(img.public_id) } catch (e) { console.error('Failed to delete image', img.public_id, e)}
          }
        }
        finalImages = retained
      } catch (e) {
        console.error("Error parsing retainedImages", e)
      }
    }

    // handle new uploaded images - append to images array
    if (req.files && req.files.length > 0) {
      const uploaded = []
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, { folder: 'vanavihari/tourist-spots' })
          uploaded.push({ url: result.secure_url, public_id: result.public_id })
        } finally {
          if (file.path) {
            try { await unlinkAsync(file.path) } catch (e) { /* silent */ }
          }
        }
      }
      // merge with existing images
      finalImages = [...finalImages, ...uploaded]
    }
    
    update.images = finalImages

    // remove undefined fields
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k])

    const updated = await TouristSpot.findByIdAndUpdate(id, update, { new: true })
    res.json({ touristSpot: updated })
  } catch (error) {
    console.error(error)
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ error: 'Slug already exists. Please use a different slug.' })
    }
    res.status(500).json({ error: error.message })
  }
}

const deleteTouristSpot = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await TouristSpot.findById(id)
    if (!existing) return res.status(404).json({ error: 'Tourist spot not found' })

    // delete images from cloudinary if any
    if (Array.isArray(existing.images)) {
      for (const img of existing.images) {
        if (img && img.public_id) {
          try { await cloudinary.uploader.destroy(img.public_id) } catch (e) { /* ignore */ }
        }
      }
    }

    await TouristSpot.findByIdAndDelete(id)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export { createTouristSpot, listTouristSpots, getTouristSpotById, updateTouristSpot, deleteTouristSpot }
