import CottageType from '../models/cottageTypeModel.js'

const createCottageType = async (req, res) => {
  try {
    const { name, description, amenities, resort } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Cottage name is required' })
    }
    if (!resort) {
      return res.status(400).json({ error: 'Resort is required' })
    }

    const cottageData = {
      name,
      description: description || '',
      amenities: amenities || [],
      resort,
    }

    const ct = new CottageType(cottageData)
    await ct.save()
    res.status(201).json({ cottageType: ct })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

const listCottageTypes = async (req, res) => {
  try {
    const list = await CottageType.find().sort({ createdAt: -1 }).populate('resort', 'resortName name _id')
    res.json({ cottageTypes: list })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getCottageType = async (req, res) => {
  try {
    const ct = await CottageType.findById(req.params.id).populate('resort', 'resortName name _id')
    if (!ct) return res.status(404).json({ error: 'Not found' })
    res.json({ cottageType: ct })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateCottageType = async (req, res) => {
  try {
    const updates = req.body || {}
    // restrict fields
    const allowed = ['name','description','amenities','resort']
    const toSet = {}
    for (const k of allowed) if (updates[k] !== undefined) toSet[k] = updates[k]
    const ct = await CottageType.findByIdAndUpdate(req.params.id, { $set: toSet }, { new: true }).populate('resort', 'resortName name _id')
    if (!ct) return res.status(404).json({ error: 'Not found' })
    res.json({ cottageType: ct })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const toggleDisableCottageType = async (req, res) => {
  try {
    const { isDisabled } = req.body
    if (typeof isDisabled !== 'boolean') return res.status(400).json({ error: 'isDisabled boolean required' })
    const ct = await CottageType.findByIdAndUpdate(req.params.id, { $set: { isDisabled } }, { new: true })
    if (!ct) return res.status(404).json({ error: 'Not found' })
    res.json({ cottageType: ct })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { createCottageType, listCottageTypes, getCottageType, updateCottageType, toggleDisableCottageType }
