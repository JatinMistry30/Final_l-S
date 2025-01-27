import fsPromises from 'fs/promises';
import path from 'path';
import express from 'express';
import { verifyTokenNotifications } from '../controllers/authController.js';

const router = express.Router();
const NOTIFICATIONS_FILE_PATH = path.join(process.cwd(), 'data', 'notifications.json');

// Add debugging middleware
router.use((req, res, next) => {

  next();
});

const readNotifications = async () => {
  try {
    const data = await fsPromises.readFile(NOTIFICATIONS_FILE_PATH, 'utf8');
    if (!data.trim()) {
      console.log('Notifications file is empty, initializing with empty array');
      return [];
    }
    const notifications = JSON.parse(data);
    return notifications;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Notifications file not found, creating new one');
      await fsPromises.writeFile(NOTIFICATIONS_FILE_PATH, '[]', 'utf8');
      return [];
    }
    console.error('Error reading notifications:', error);
    throw error;
  }
};

const writeNotifications = async (notifications) => {
  try {
    await fsPromises.writeFile(
      NOTIFICATIONS_FILE_PATH, 
      JSON.stringify(notifications, null, 2)
    );
    console.log(`Wrote ${notifications.length} notifications to file`);
  } catch (error) {
    console.error('Error writing notifications:', error);
    throw error;
  }
};

// Mark notification as read
router.post('/notifications/:id/read', verifyTokenNotifications, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.userId;


  try {
    const notifications = await readNotifications();

    // Find notification and ensure it belongs to user
    const notificationIndex = notifications.findIndex(n => 
      n.id === notificationId && String(n.userId) === String(userId)
    );

    if (notificationIndex === -1) {
      console.log('Notification not found or unauthorized:', {
        notificationId,
        userId,
        availableIds: notifications.map(n => n.id)
      });
      return res.status(404).json({ 
        message: 'Notification not found',
        detail: 'The notification may have been deleted or you may not have permission to access it'
      });
    }

    // Update the notification
    notifications[notificationIndex].read = true;
    await writeNotifications(notifications);

    console.log('Successfully marked notification as read:', {
      notificationId,
      userId
    });

    res.json(notifications[notificationIndex]);
  } catch (error) {
    console.error('Server error while marking notification as read:', error);
    res.status(500).json({ 
      message: 'Error marking notification as read',
      error: error.message 
    });
  }
});

// Get user notifications
router.get('/notifications', verifyTokenNotifications, async (req, res) => {
  const userId = req.userId;
  

  try {
    const allNotifications = await readNotifications();
    
    const userNotifications = allNotifications.filter(n => 
      String(n.userId) === String(userId)
    );
    

    const sortedNotifications = userNotifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json(sortedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications',
      error: error.message 
    });
  }
});

// Create notification helper function
const createNotification = async (userId, type, message, reportId) => {
  console.log('Creating new notification:', {
    userId,
    type,
    message,
    reportId
  });

  try {
    const notifications = await readNotifications();
    const newNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: String(userId),
      type,
      message,
      reportId: String(reportId), // Make sure reportId is included
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    notifications.push(newNotification);
    await writeNotifications(notifications);
    
    console.log('Successfully created notification:', newNotification);
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
export default router;
export { createNotification };