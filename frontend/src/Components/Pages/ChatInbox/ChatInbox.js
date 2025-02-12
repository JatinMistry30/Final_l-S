import React, { useEffect, useState, useRef } from "react";
import { SendHorizontal, Paperclip, Check, CheckCheck } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import './ChatInbox.css';

const API = "http://localhost:5000";
const socket = io(API);

const ChatInbox = () => {
  const location = useLocation();
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

  // Scroll to bottom effect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle navigation and initial message
  useEffect(() => {
    const initializeChat = async () => {
      if (location.state?.userId && currentUser) {
        try {
          const response = await axios.get(`${API}/api/auth/${location.state.userId}`, {
            withCredentials: true
          });
          const targetUser = response.data;
          setSelectedUser(targetUser);
          
          if (location.state.prebuiltMessage) {
            setMessage(location.state.prebuiltMessage);
          }
        } catch (error) {
          console.error("Failed to fetch user details:", error);
        }
      }
    };

    initializeChat();
  }, [location.state, currentUser]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API}/api/auth/current`, {
          withCredentials: true
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;
      
      try {
        const response = await axios.get(`${API}/api/messages/getcontacted-users`, {
          withCredentials: true
        });
        setAllUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Socket connection
  useEffect(() => {
    if (!currentUser) return;

    socket.emit("user:connect", currentUser.userId);
    
    socket.on("message:received", (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });
    
    socket.on("user:typing", ({ userId, isTyping }) => {
      setTyping(prev => ({ ...prev, [userId]: isTyping }));
    });

    return () => {
      socket.off("message:received");
      socket.off("user:typing");
    };
  }, [currentUser]);

  // Fetch messages
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
        console.error("Failed to fetch messages:", error);
      }
    };

    if (selectedUser && currentUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, currentUser]);

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
      socket.emit("message:send", newMessage);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="main-area-container">
      <div className="left-area-container-list">
        <div className="users-left-row">
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
            >
              <div className="user-avatar">
                {user.username[0].toUpperCase()}
              </div>
              <div className="user-info">
                <p className="user-name">{user.username}</p>
                <p className="user-status">
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
              <div className="user-avatar">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <h1>{selectedUser.username}</h1>
            </div>

            <div className="messages-container" ref={messagesEndRef}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender_id === currentUser.userId ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{msg.message_text}</p>
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bottom-enter-text-button">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="message-input"
              />
              <button 
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
                className="send-button"
              >
                <SendHorizontal />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInbox;