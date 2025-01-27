import db from './db.js';

export const createItem = async (itemData) => {
  const [result] = await db.query(
    `INSERT INTO items (userId, type, itemName, description, category, location, date_reported, time_reported, photoPath) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemData.userId,
      itemData.type,
      itemData.itemName,
      itemData.description,
      itemData.category,
      itemData.location,
      itemData.dateReported,
      itemData.timeReported,
      itemData.photoPath
    ]
  );
  return result;
};

export const getItems = async () => {
  const [rows] = await db.query(
    `SELECT 
      id,
      userId,
      type,
      itemName,
      description,
      category,
      location,
      date_reported as dateReported,
      time_reported as timeReported,
      photoPath,
      status,
      created_at as createdAt
    FROM items 
    ORDER BY date_reported DESC`
  );
  return rows;
};
