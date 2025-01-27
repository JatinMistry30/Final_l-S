import express from 'express';
import { register, login, logout,getCurrentUser, getCurrentUserData, updateProfile, getCurrentUserDataLog, getAllUsers} from '../controllers/authController.js';
import { verifyAuth, verifyAuthMain } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyAuthMain);
router.get('/logout', logout);
router.get('/userdetails', getCurrentUser);
router.get('/current', getCurrentUserData);
router.get('/profiledata',getCurrentUserData)
router.put('/updateprofile',updateProfile)
router.get('/getallusers',getAllUsers)
router.get('/protected', verifyAuthMain, (req, res) => {
  res.json({ msg: 'Protected route accessed', user: req.user });
});

export default router;
