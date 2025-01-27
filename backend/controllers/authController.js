import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide both email and password' });
  }

  try {
    // Use promise-based query
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!results.length) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000 // 1 hour
    });

    // Send response
    res.json({
      msg: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
export const getCurrentUser = (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Please login first' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    res.json({ userId: req.userId });  // Send userId back to the frontend
  } catch (error) {
    console.error('Authentication failed', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};
export const getCurrentUserData = async (req, res) => {
  try {
    const token = req.cookies.token;  // Get the JWT token from cookies
    if (!token) {
      return res.status(401).json({ message: 'Please login first' });  // If no token, send an error
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the JWT token
    req.user = decoded;
    req.userId = decoded.id;  // Store user info from token for use in further requests

    // Fetch user details based on the userId
    const [userDetails] = await db.query(
      'SELECT username, email, age, course, year, mobile_number FROM users WHERE id = ?',
      [req.userId]
    );

    if (!userDetails.length) {
      return res.status(404).json({ message: 'User not found' });  // Handle case where user is not found in the DB
    }

    // Prepare response with available data
    const responseData = {
      userId: req.userId,
      username: userDetails[0].username,
      email: userDetails[0].email,
    };

    // Add additional fields only if they exist
    if (userDetails[0].age) {
      responseData.age = userDetails[0].age;
    }
    if (userDetails[0].course) {
      responseData.course = userDetails[0].course;
    }
    if (userDetails[0].year) {
      responseData.year = userDetails[0].year;
    }
    if (userDetails[0].mobile_number) {
      responseData.mobile_number = userDetails[0].mobile_number;
    }

    // Send back the user data (including optional fields if they exist)
    res.json(responseData);
    
  } catch (error) {
    console.error('Authentication failed', error);
    res.status(401).json({ message: 'Authentication failed' });  // If token is invalid or expired, send error
  }
};

export const updateProfile = async (req, res) => {
  const { age, course, year, mobile_number } = req.body;

  if (!age || !course || !year || !mobile_number) {
    return res.status(400).json({ msg: 'Please provide all the fields' });
  }
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the JWT token
  req.user = decoded;
  req.userId = decoded.id;
  const userId = req.userId;

  try {
    // Update the user's profile in the database
    const [result] = await db.query(
      'UPDATE users SET age = ?, course = ?, year = ?, mobile_number = ? WHERE id = ?',
      [age, course, year, mobile_number, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Send back the updated data
    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ msg: 'Error updating profile' });
  }
};
// Register function
export const register = async (req, res) => {
  console.log('Registration request received:', req.body);
  const { username, email, password, age = null, course = null, year = null } = req.body;

  try {
    // Check for required fields
    if (!username || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Check if user exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Existing users check completed');

    if (existingUsers.length) {
      console.log('User already exists');
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, age, course, year) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, age, course, year]
    );
    console.log('User inserted:', result);

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Error registering user: ' + error.message });
  }
};


export const verifyToken = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, msg: 'Invalid token' });
  }
};


// Logout function
export const logout = (req, res) => {
  res.clearCookie('token');  // Clear JWT cookie
  res.json({ msg: 'Logout successful' });
};
// Assuming getCurrentUserData is a function that attaches user data to req.user
export const getCurrentUserDataLog = async (req, res, next) => {
  try {
    const token = req.cookies.token;  // Get the JWT token from cookies
    if (!token) {
      return res.status(401).json({ message: 'Please login first' });  // If no token, send an error
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the JWT token
    req.user = decoded;
    req.userId = decoded.id;  // Store user info from token for use in further requests

    // Fetch user details based on the userId
    const [userDetails] = await db.query(
      'SELECT username, email, age, course, year, mobile_number FROM users WHERE id = ?',
      [req.userId]
    );

    if (!userDetails.length) {
      return res.status(404).json({ message: 'User not found' });  // Handle case where user is not found in the DB
    }

    // Add user data to the request
    req.user.username = userDetails[0].username;
    req.user.email = userDetails[0].email;
    req.user.age = userDetails[0].age;
    req.user.course = userDetails[0].course;
    req.user.year = userDetails[0].year;
    req.user.mobile_number = userDetails[0].mobile_number;

    next();  // Continue to the next middleware or route handler
  } catch (error) {
    console.error('Authentication failed', error);
    res.status(401).json({ message: 'Authentication failed' });  // If token is invalid or expired, send error
  }
};


export const verifyTokenNotifications = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    console.log('No token found in cookies');
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    req.userId = verified.id;  
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ error: "Invalid token" });
  }
};

export const getAllUsers = async (req, res) => {

  
  try {
    const query = "SELECT id, username, email FROM users"; 
    const [result] = await db.query(query); 
    
    if (result.length === 0) { // Adjusted to check result length directly
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json(result); // Return result directly

  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "An error occurred while fetching users" });
  }
}