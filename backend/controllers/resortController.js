import Resort from '../models/resortModel.js'
import cloudinary from '../config/cloudinaryConfig.js'
import fs from 'fs'
import { promisify } from 'util'
const unlinkAsync = promisify(fs.unlink)

// Helper function to generate slug from text
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

// Helper function to ensure slug uniqueness
const ensureUniqueSlug = async (slug, excludeId = null) => {
  let uniqueSlug = slug
  let counter = 1
  
  while (true) {
    const query = { slug: uniqueSlug }
    if (excludeId) query._id = { $ne: excludeId }
    
    const existing = await Resort.findOne(query)
    if (!existing) break
    
    uniqueSlug = `${slug}-${counter}`
    counter++
  }
  
  return uniqueSlug
}

// create resort with optional logo upload (logoFile is cloudinary uploaded result)
const createResort = async (req, res) => {
  try {
    const body = req.body || {}

    // helper to normalize values from multipart/form-data where fields may be arrays
    const v = (key) => {
      const val = body[key]
      if (Array.isArray(val)) return val[0]
      return val
    }

    const resortName = v('resortName')
    if (!resortName) {
      return res.status(400).json({ error: 'Resort name is required' })
    }

    // Handle slug: use provided slug or generate from resort name
    let slug = v('slug')
    if (!slug) {
      slug = generateSlug(resortName)
    } else {
      slug = generateSlug(slug)
    }
    
    // Ensure slug is unique
    slug = await ensureUniqueSlug(slug)

    const resortData = {
      resortName,
      slug,
      contactPersonName: v('contactPersonName'),
      contactNumber: v('contactNumber'),
      email: v('email'),
      address: {
        line1: v('addressLine1'),
        line2: v('addressLine2'),
        cityDistrict: v('cityDistrict'),
        stateProvince: v('stateProvince'),
        postalCode: v('postalCode'),
        country: v('country'),
      },
      website: v('website'),
      foodProviding: v('foodProviding'),
      foodDetails: v('foodDetails'),
      roomIdPrefix: v('roomIdPrefix'),
      extraGuestCharges: v('extraGuestCharges') ? Number(v('extraGuestCharges')) : undefined,
      supportNumber: v('supportNumber'),
    }

    // if multer provided a file, upload to cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'vanavihari/resorts' })
        resortData.logo = { url: result.secure_url, public_id: result.public_id }
      } finally {
        // attempt to remove temp file if it exists
        if (req.file && req.file.path) {
          try {
            await unlinkAsync(req.file.path)
          } catch (e) {
            // log but don't fail the request because of cleanup error
            console.warn('Failed to remove temp file:', req.file.path, e.message || e)
          }
        }
      }
    }

    const resort = new Resort(resortData)
    await resort.save()

    res.status(201).json({ resort })
  } catch (error) {
    console.error(error)
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ error: 'Slug already exists. Please use a different slug.' })
    }
    res.status(500).json({ error: error.message })
  }
}

const listResorts = async (req, res) => {
  try {
    const { slug } = req.query
    
    // If slug is provided, return single resort
    if (slug) {
      const resort = await Resort.findOne({ slug })
      if (!resort) {
        return res.status(404).json({ error: 'Resort not found' })
      }
      return res.json({ resort })
    }
    
    // Otherwise return all resorts
    const resorts = await Resort.find().sort({ createdAt: -1 })
    res.json({ resorts })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getResortById = async (req, res) => {
  try {
    const { id } = req.params
    const resort = await Resort.findById(id)
    if (!resort) {
      return res.status(404).json({ error: 'Resort not found' })
    }
    res.json({ resort })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// update existing resort (JSON or multipart). If logo file uploaded, replace logo.
const updateResort = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await Resort.findById(id)
    if (!existing) return res.status(404).json({ error: 'Resort not found' })

    const body = req.body || {}
    const v = (key) => {
      const val = body[key]
      if (Array.isArray(val)) return val[0]
      return val
    }

    const update = {
      resortName: v('resortName'),
      contactPersonName: v('contactPersonName'),
      contactNumber: v('contactNumber'),
      email: v('email'),
      address: {
        line1: v('addressLine1'),
        line2: v('addressLine2'),
        cityDistrict: v('cityDistrict'),
        stateProvince: v('stateProvince'),
        postalCode: v('postalCode'),
        country: v('country'),
      },
      website: v('website'),
      foodProviding: v('foodProviding'),
      foodDetails: v('foodDetails'),
      roomIdPrefix: v('roomIdPrefix'),
      extraGuestCharges: v('extraGuestCharges') ? Number(v('extraGuestCharges')) : undefined,
      supportNumber: v('supportNumber'),
    }

    // Handle slug update
    const slugInput = v('slug')
    if (slugInput) {
      let newSlug = generateSlug(slugInput)
      // Only check uniqueness if slug actually changed
      if (newSlug !== existing.slug) {
        newSlug = await ensureUniqueSlug(newSlug, id)
        update.slug = newSlug
      }
    }

    if (req.file) {
      try {
        // if existing logo, optionally delete previous from cloudinary
        if (existing.logo?.public_id) {
          try { await cloudinary.uploader.destroy(existing.logo.public_id) } catch (e) { /* silent */ }
        }
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'vanavihari/resorts' })
        update.logo = { url: result.secure_url, public_id: result.public_id }
      } finally {
        if (req.file?.path) {
          try { await unlinkAsync(req.file.path) } catch (e) { /* silent */ }
        }
      }
    }

    // remove undefined to avoid overwriting with undefined
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k])
    if (update.address) {
      Object.keys(update.address).forEach(k => update.address[k] === undefined && delete update.address[k])
    }

    const updated = await Resort.findByIdAndUpdate(id, update, { new: true })
    res.json({ resort: updated })
  } catch (error) {
    console.error(error)
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ error: 'Slug already exists. Please use a different slug.' })
    }
    res.status(500).json({ error: error.message })
  }
}
export { createResort, listResorts, getResortById, updateResort }
