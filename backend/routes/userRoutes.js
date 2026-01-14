import express from 'express';
import { loginUser, registerUser, adminLogin, getUserProfile, updateUserProfile, getAllUsers, updateUserById, deleteUserById, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)
userRouter.get('/verify-email/:token', verifyEmail)
userRouter.post('/resend-verification', resendVerificationEmail)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password/:token', resetPassword)
userRouter.get('/profile', auth, getUserProfile)
userRouter.put('/profile', auth, updateUserProfile)
userRouter.get('/all', getAllUsers)
userRouter.put('/:id', updateUserById)
userRouter.delete('/:id', deleteUserById)

export default userRouter;