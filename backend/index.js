import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import foundReportsRoutes from './routes/detailsRoutes.js';
import foundReportsRoute from './routes/foundRoutes.js';
import claimSubmitRoute from './routes/claimSubmitRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import  messageRoutes  from './routes/messageRoutes.js'; 
import { Server } from 'socket.io';
import { createServer } from 'http';
import multer from 'multer';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});
const storageChatImages = multer.diskStorage({
  destination: 'uploadsChatImages/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadChatImages = multer({ 
  storageChatImages,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
const onlineUsers = new Set();

io.on('connection', (socket) => {
  socket.on('user:connect', (userId) => {
    onlineUsers.add(userId);
    socket.userId = userId;
    io.emit('user:online', userId);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user:offline', socket.userId);
    }
  });

  socket.on('message:send', (message) => {
    socket.to(message.receiver_id).emit('message:received', message);
  });

  socket.on('user:typing', ({ userId, receiverId, isTyping }) => {
    socket.to(receiverId).emit('user:typing', { userId, isTyping });
  });
});
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', itemRoutes);
app.use("/api/found-reports", foundReportsRoute);
app.use('/userinbox', notificationRoutes);
app.use('/api/notification/found-reports', foundReportsRoutes);
app.use("/api/claim-reports", claimSubmitRoute);
app.use('/api/notification/claim-reports', claimRoutes);
app.use('/api/messages',messageRoutes)
app.post('/api/messages/upload', uploadChatImages.single('file'), async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;
    const file = req.file;

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    
    const [result] = await db.execute(
      `INSERT INTO messages (sender_id, receiver_id, message_text, file_url, file_name, file_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sender_id, receiver_id, '', fileUrl, file.originalname, file.mimetype]
    );

    res.json({
      id: result.insertId,
      sender_id,
      receiver_id,
      message_text: '',
      file_url: fileUrl,
      file_name: file.originalname,
      file_type: file.mimetype,
      timestamp: new Date(),
      status: 'sent'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});
app.use('/uploads', express.static('uploads/chatImages'));
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
