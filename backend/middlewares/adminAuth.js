import jwt from 'jsonwebtoken'
import Admin from '../models/adminModel.js'

const adminAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || req.headers.Authorization
		if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })

		const token = authHeader.split(' ')[1]
		const secret = process.env.JWT_SECRET || 'devsecret'
		const payload = jwt.verify(token, secret)
		if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token' })

		const admin = await Admin.findById(payload.id).select('-password')
		if (!admin) return res.status(401).json({ error: 'Admin not found' })

		req.admin = admin
		next()
	} catch (err) {
		return res.status(401).json({ error: 'Unauthorized', details: err.message })
	}
}

export default adminAuth
