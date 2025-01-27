import { createItem, getItems } from '../models/itemModel.js';

export const createItemReport = async (req, res) => {
  try {
    const { userId, type, itemName, description, category, location, dateReported, timeReported } = req.body;
    
    let photoPath = null;
    if (req.file) {
      photoPath = req.file.filename;  // Store only the filename
    }

    // Validate required fields
    if (!userId || !type || !itemName || !description || !category || !location || !dateReported || !timeReported) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await createItem({
      userId,
      type,
      itemName,
      description,
      category,
      location,
      dateReported,
      timeReported,
      photoPath,
    });

    res.status(201).json({
      success: true,
      message: "Item report created successfully",
      data: {
        id: result.insertId,
        photoPath
      },
    });
  } catch (error) {
    console.error("Error creating item report:", error);
    res.status(500).json({ success: false, message: "Server error while creating item report" });
  }
};

export const getItemsList = async (req, res) => {
  try {
    const items = await getItems();
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, message: 'Error fetching items' });
  }
};