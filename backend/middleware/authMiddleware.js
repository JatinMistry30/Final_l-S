import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();
export const verifyAuthMain = (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ valid: false, msg: 'No token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, msg: 'Invalid token' });
  }
};
// Assuming you have this in verifyAuth middleware
export const verifyAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ valid: false, msg: 'No token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach the decoded user information to the req object
    next();  // Proceed to the next middleware
  } catch (err) {
    res.status(401).json({ valid: false, msg: 'Invalid token' });
  }
};
