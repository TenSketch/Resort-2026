import adminAuth from './adminAuth.js'

// requireRole middleware - checks if admin has one of the specified roles
// Usage: requireRole('superadmin') or requireRole('superadmin', 'admin')
const requireRole = (...roles) => {
    return [adminAuth, (req, res, next) => {
        try {
            if (!req.admin || !req.admin.role) {
                return res.status(403).json({ error: 'Forbidden: No role assigned' })
            }

            if (!roles.includes(req.admin.role)) {
                return res.status(403).json({
                    error: 'Forbidden: Insufficient role',
                    required: roles,
                    current: req.admin.role
                })
            }

            next()
        } catch (err) {
            return res.status(403).json({ error: 'Forbidden' })
        }
    }]
}

export default requireRole
