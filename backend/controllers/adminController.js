import Admin from '../models/adminModel.js'
import bcrypt from 'bcrypt'

// List all admin users (excluding passwords)
export const listAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 })
        res.json({ success: true, admins })
    } catch (error) {
        console.error('Error listing admins:', error)
        res.status(500).json({ error: 'Failed to fetch admins' })
    }
}

// Create new admin user
export const createAdmin = async (req, res) => {
    try {
        const { username, password, name, role, permissions } = req.body

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' })
        }

        // Check if username already exists
        const existingAdmin = await Admin.findOne({ username })
        if (existingAdmin) {
            return res.status(400).json({ error: 'Username already exists' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create admin
        const newAdmin = new Admin({
            username,
            password: hashedPassword,
            name: name || username,
            role: role || 'admin',
            permissions: permissions || {}
        })

        await newAdmin.save()

        // Return without password
        const adminResponse = newAdmin.toObject()
        delete adminResponse.password

        res.status(201).json({ success: true, admin: adminResponse })
    } catch (error) {
        console.error('Error creating admin:', error)
        res.status(500).json({ error: 'Failed to create admin' })
    }
}

// Update admin user
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params
        const { name, role, permissions, password } = req.body

        const admin = await Admin.findById(id)
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' })
        }

        // Update fields
        if (name !== undefined) admin.name = name
        if (role !== undefined) admin.role = role
        if (permissions !== undefined) admin.permissions = permissions

        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10)
            admin.password = await bcrypt.hash(password, salt)
        }

        await admin.save()

        // Return without password
        const adminResponse = admin.toObject()
        delete adminResponse.password

        res.json({ success: true, admin: adminResponse })
    } catch (error) {
        console.error('Error updating admin:', error)
        res.status(500).json({ error: 'Failed to update admin' })
    }
}

// Delete admin user
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params

        // Prevent deleting yourself
        if (req.admin._id.toString() === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' })
        }

        const admin = await Admin.findByIdAndDelete(id)
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' })
        }

        res.json({ success: true, message: 'Admin deleted successfully' })
    } catch (error) {
        console.error('Error deleting admin:', error)
        res.status(500).json({ error: 'Failed to delete admin' })
    }
}
