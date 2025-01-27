import express from 'express';
import db from '../models/db.js';
import { getCurrentUserDataLog } from '../controllers/authController.js';
import { createNotification } from '../routes/notificationRoutes.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Fetch report details route
router.get('/:id', getCurrentUserDataLog, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        fr.*,
        i.itemName,
        i.description as itemDescription,
        u.email as finderEmail,
        u.mobile_number as finderMobile
      FROM claim_reports fr
      JOIN items i ON fr.item_id = i.id
      JOIN users u ON fr.finder_id = u.id
      WHERE fr.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: 'Report not found',
        detail: `No report found with ID ${req.params.id}`
      });
    }

    // Format the response
    const report = {
      id: rows[0].id,
      itemId: rows[0].item_id,
      itemName: rows[0].itemName,
      description: rows[0].description,
      itemDescription: rows[0].itemDescription,
      location: rows[0].location,
      photoPath: rows[0].photo_path,
      finderEmail: rows[0].finderEmail,
      finderMobile: rows[0].finderMobile,
      status: rows[0].status || 'pending',
      createdAt: rows[0].created_at,
      finderId: rows[0].finder_id
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch report details',
      error: error.message 
    });
  }
});

// Handle accept/reject response
router.post('/:id/respond', getCurrentUserDataLog, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      // Fetch the found report details
      const [reports] = await db.query(
        'SELECT finder_id, item_id FROM claim_reports WHERE id = ?',
        [id]
      );
  
      if (reports.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
  
      const report = reports[0];
  
      // Fetch the finder details
      const [finderDetails] = await db.query(
        'SELECT username FROM users WHERE id = ?',
        [report.finder_id]
      );
  
      // Update the status of the found report
      await db.query(
        'UPDATE claim_reports SET status = ? WHERE id = ?',
        [status, id]
      );
  
      // Update the item's status if the report is accepted
      if (status === 'accepted') {
        // Fetch the current item type (lost or found)
        const [items] = await db.query(
          'SELECT type FROM items WHERE id = ?',
          [report.item_id]
        );
  
        if (items.length === 0) {
          return res.status(404).json({ message: 'Item not found' });
        }
  
        const item = items[0];
  
// Update item status based on its type
const newStatus = 'resolved'; // Use resolved for both founded and claimed

await db.query(
  'UPDATE items SET status = ? WHERE id = ?',
  [newStatus, report.item_id]
);

      }
  
      // Create a notification for the finder
      const notificationMessage = status === 'accepted'
        ? `Your Claim report has been accepted! The owner will contact you soon.`
        : `Your Claim report has been rejected.`;
  
      await createNotification(
        report.finder_id,
        'Claim Report Response',
        notificationMessage,
        id
      );
  
      res.json({
        message: 'Response processed successfully',
        status: status,
      });
    } catch (error) {
      console.error('Error processing response:', error);
      res.status(500).json({ message: 'Failed to process response' });
    }
  });
  

export default router;