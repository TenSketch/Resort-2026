import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'

const auth = async (req, res, next) => {
  try {
    const { token } = req.headers
    
    if (!token) {
      return res.status(401).json({ 
        code: 4001,
        result: { 
          status: 'error', 
          msg: 'Not Authorized, Login Again' 
        }
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    const user = await userModel.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(401).json({ 
        code: 4001,
        result: { 
          status: 'error', 
          msg: 'User not found' 
        }
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ 
      code: 4001,
      result: { 
        status: 'error', 
        msg: 'Not Authorized, Login Again' 
      }
    })
  }
}

export default auth