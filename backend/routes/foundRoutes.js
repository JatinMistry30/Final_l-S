import express from 'express';
import multer from 'multer';
import FoundReport from '../models/foundReport.js'; 
import { getCurrentUserData, getCurrentUserDataLog} from '../controllers/authController.js';
const router = express.Router();
import db from '../models/db.js';
import fs from 'fs';
import path from 'path';
const uploadDir = 'uploads/found-reports';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, and .jpeg formats allowed!'));
        }
    }
});
router.post('/', upload.single('photo'), getCurrentUserDataLog, async (req, res) => {
    try {
      // Ensure file is uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Ensure mobile_number is available
      if (!req.user.mobile_number) {
        return res.status(400).json({ message: 'Mobile number is required' });
      }

      // Validate required fields for item owner
      const { itemOwnerId, itemOwnerUsername, itemOwnerEmail } = req.body;
      
      if (!itemOwnerId || itemOwnerId === 'undefined') {
        return res.status(400).json({ message: 'Item Owner ID is required' });
      }

      if (!itemOwnerUsername || itemOwnerUsername === 'undefined') {
        return res.status(400).json({ message: 'Item Owner Username is required' });
      }

      if (!itemOwnerEmail || itemOwnerEmail === 'undefined') {
        return res.status(400).json({ message: 'Item Owner Email is required' });
      }

      console.log('Request Body:', req.body);

      const reportData = {
        itemId: parseInt(req.body.itemId),
        location: req.body.location,
        description: req.body.description,
        photoPath: req.file.path,
        finderId: req.userId,
        finderMobile: req.user.mobile_number,
        finderEmail: req.user.email,
        itemOwnerId: req.body.itemOwnerId,
        itemOwnerUsername: req.body.itemOwnerUsername,
        itemOwnerEmail: req.body.itemOwnerEmail,
      };
      

      console.log('Report Data:', reportData);  // Log the report data

      // Create the found report
      const result = await FoundReport.createReport(reportData);

      res.status(201).json({
        message: 'Found report created successfully.',
        report: result
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        message: 'Failed to create found report',
        error: error.message
      });
    }
});


// GET route in foundReports.js
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Modified query to get all necessary details
        const [rows] = await db.query(`
            SELECT 
                i.id AS itemId,
                i.itemName,
                i.description AS itemDescription,
                i.userId AS ownerId,
                u.username AS ownerUsername,
                u.email AS ownerEmail
            FROM items i
            JOIN users u ON i.userId = u.id
            WHERE i.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const itemDetails = rows[0];

        // Send back structured response
        res.status(200).json({
            itemId: itemDetails.itemId,
            itemName: itemDetails.itemName,
            description: itemDetails.itemDescription,
            ownerId: itemDetails.ownerId,
            ownerUsername: itemDetails.ownerUsername,
            ownerEmail: itemDetails.ownerEmail
        });

    } catch (err) {
        console.error("Failed to fetch item details:", err);
        res.status(500).json({ 
            message: 'Failed to fetch item details',
            error: err.message 
        });
    }
});
  export default router;
  