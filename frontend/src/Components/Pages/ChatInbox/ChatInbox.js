import React, { useEffect, useState, useRef } from "react";
import { SendHorizontal, Paperclip, Check, CheckCheck } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import "./ChatInbox.css";

const API = "http://localhost:5000";
const socket = io(API);

const ChatInbox = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(`${API}/api/auth/getallusers`, {
          withCredentials: true,
        });
        if (currentUser) {
          const filteredUsers = response.data.filter(
            (user) => user.id !== currentUser.userId
          );
          setAllUsers(filteredUsers);
        }
      } catch (error) {
        console.error("Failed to fetch all users", error);
      }
    };
    fetchAllUsers();
  }, [currentUser]);
  
  useEffect(() => {
    if (!currentUser) return;

    socket.emit('user:connect', currentUser.userId);
    
    socket.on('user:online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });
    
    socket.on('user:offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    
    socket.on('message:received', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });
    
    socket.on('user:typing', ({ userId, isTyping }) => {
      setTyping(prev => ({ ...prev, [userId]: isTyping }));
    });

    return () => {
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('message:received');
      socket.off('user:typing');
    };
  }, [currentUser]);



  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API}/api/auth/current`, {
          withCredentials: true,
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user", error);
      }
    }
    fetchCurrentUser();
  }, []);

  // Typing indicator handler
  let typingTimeout = null;
  const handleTyping = () => {
    if (selectedUser) {
      socket.emit('user:typing', {
        userId: currentUser.userId,
        receiverId: selectedUser.id,
        isTyping: true
      });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('user:typing', {
          userId: currentUser.userId,
          receiverId: selectedUser.id,
          isTyping: false
        });
      }, 2000);
    }
  };

  // File handling
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size should not exceed 5MB');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sender_id', currentUser.userId);
      formData.append('receiver_id', selectedUser.id);

      const response = await axios.post(
        `${API}/api/messages/upload`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessages(prev => [...prev, response.data]);
      socket.emit('message:send', response.data);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
      fileInputRef.current.value = '';
    }
  };

  // Mark messages as read
  useEffect(() => {
    if (selectedUser && currentUser) {
      const markMessagesAsRead = async () => {
        try {
          await axios.put(
            `${API}/api/messages/read/${selectedUser.id}/${currentUser.userId}`,
            {},
            { withCredentials: true }
          );
          
          setMessages(prev => 
            prev.map(msg => 
              msg.sender_id === selectedUser.id ? { ...msg, status: 'read' } : msg
            )
          );
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };

      markMessagesAsRead();
    }
  }, [selectedUser, messages]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser || !currentUser) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/api/messages/send`,
        {
          sender_id: currentUser.userId,
          receiver_id: selectedUser.id,
          message_text: message.trim(),
        },
        { withCredentials: true }
      );

      const newMessage = response.data;
      setMessages(prev => [...prev, newMessage]);
      socket.emit('message:send', newMessage);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };
  const handleUserClick = (user) => {
    setSelectedUser(user);
  };
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !currentUser) return;
      
      try {
        const response = await axios.get(
          `${API}/api/messages/${currentUser.userId}/${selectedUser.id}`,
          { withCredentials: true }
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser, currentUser]);
  return (
    <div className="main-area-container">
      <div className="left-area-container-list">
        <input 
          type="text" 
          placeholder="Search for a user" 
          className="search-input"
        />
        <div className="users-left-row">
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
            >
              <div className="user-avatar">
                {user.username[0].toUpperCase()}
              </div>
              <div className="user-info">
                <p className="user-name">{user.username}</p>
                <p className={`user-status ${onlineUsers.has(user.id) ? 'online' : ''}`}>
                  {onlineUsers.has(user.id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="users-right-row">
        {selectedUser ? (
          <>
            <div className="selected-user-info">
              <div className="top-bar-name">
                <div className="user-avatar">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h1>{selectedUser.username}</h1>
                  <p>{onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
            
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.sender_id === currentUser.userId ? 'sent' : 'received'
                  }`}
                >
                  {msg.file_url ? (
                    <div className="attachment-preview">
                      {msg.file_type?.startsWith('image/') ? (
                        <img src={msg.file_url} alt="attachment" />
                      ) : (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                          Download {msg.file_name}
                        </a>
                      )}
                    </div>
                  ) : null}
                  <div className="message-content">
                    <p className="message-text">{msg.message_text}</p>
                    <div className="message-status">
                      <span className="timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.sender_id === currentUser.userId && (
                        <span className="status-icon">
                          {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {typing[selectedUser.id] && (
                <div className="typing-indicator">
                  {selectedUser.username} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bottom-enter-text-button">
              <button 
                className="attachment-button"
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
              >
                <Paperclip />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx"
              />
              <div className="message-input-container">
                <textarea
                  className="message-input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <button 
                className="send-button"
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
              >
                <SendHorizontal />
              </button>
            </div>
          </>
        ) : (
          <div className="no-user-selected">
            <h2>Select a user to start chatting</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInbox;