
import db from "./db.js";
import { createNotification } from "../routes/notificationRoutes.js";
class ClaimReport {
  static async createReport(reportData) {
    try {
      const [result] = await db.query(
        `INSERT INTO claim_reports 
         (item_id, location, description, photo_path, finder_id, finder_mobile, finder_email, item_owner_id, item_owner_username, item_owner_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reportData.itemId,
          reportData.location,
          reportData.description,
          reportData.photoPath,
          reportData.finderId,
          reportData.finderMobile,
          reportData.finderEmail,
          reportData.itemOwnerId,
          reportData.itemOwnerUsername,
          reportData.itemOwnerEmail,
        ]
      );
      
      // Get the inserted report ID
      const reportId = result.insertId;
      
      // Create notification with the report ID
      await createNotification(
        reportData.itemOwnerId,
        'Claim Done Report',
        `An item you Found has been claimed as claim by ${reportData.finderEmail},${reportData.finderMobile}!`,
        reportId  // Pass the report ID to the notification
      );
      
      return result;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }
 }
 
export default ClaimReport
