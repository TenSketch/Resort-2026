import adminAuth from './adminAuth.js'

// permissionName: string -> checks req.admin.permissions[permissionName]
const requirePermission = (permissionName) => {
  return [adminAuth, (req, res, next) => {
    try {
      // Superadmin bypasses permission checks
      if (req.admin && req.admin.role === 'superadmin') return next()
      const perms = (req.admin && req.admin.permissions) || {}
      if (perms[permissionName]) return next()
      return res.status(403).json({ error: 'Forbidden: missing permission ' + permissionName })
    } catch (err) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }]
}

export default requirePermission
