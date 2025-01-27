import express from 'express';
import db from "../models/db.js";

const router = express.Router();

router.get('/:senderId/:receiverId', async (req, res) => {
    try {
      const { senderId, receiverId } = req.params;
      
      const [messages] = await db.execute(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
         ORDER BY timestamp ASC`,
        [senderId, receiverId, receiverId, senderId]
      );
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });
  
  // Send a new message
  router.post('/send', async (req, res) => {
    try {
      const { sender_id, receiver_id, message_text } = req.body;
      
      const [result] = await db.execute(
        `INSERT INTO messages (sender_id, receiver_id, message_text) 
         VALUES (?, ?, ?)`,
        [sender_id, receiver_id, message_text]
      );
      
      res.json({ 
        id: result.insertId,
        sender_id,
        receiver_id,
        message_text,
        timestamp: new Date(),
        status: 'sent'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
  
  // Mark messages as read
  router.put('/read/:senderId/:receiverId', async (req, res) => {
    try {
      const { senderId, receiverId } = req.params;
      
      await db.execute(
        `UPDATE messages 
         SET status = 'read' 
         WHERE sender_id = ? AND receiver_id = ? AND status != 'read'`,
        [senderId, receiverId]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  });

export default router