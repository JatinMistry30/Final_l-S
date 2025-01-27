import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [visibleNotificationsCount, setVisibleNotificationsCount] = useState(3); // Track visible notifications
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.get('http://localhost:5000/userinbox/notifications', {
        withCredentials: true,
        timeout: 5000
      });
      
      const notificationData = Array.isArray(response.data) 
        ? response.data 
        : response.data.notifications || [];
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter((n) => !n.read).length);
      setError(null);
    } catch (error) {
      console.error('Fetch error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        navigate('/login');
      } else {
        setError('Unable to fetch notifications');
      }
    }
  }, [isAuthenticated, navigate, setIsAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    console.log('Clicked notification:', notification); // Add this line

    if (!notification?.id) {
      console.error('Invalid notification object:', notification);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/userinbox/notifications/${notification.id}/read`,
        {}, 
        { withCredentials: true, timeout: 5000 }
      );

      if (response.status === 200) {
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));

        // Check the notification type and navigate accordingly
        if (notification.type === "Claim Done Report" && notification.reportId) {
          navigate(`/claim-found-item/${notification.reportId}`);
        } else if (notification.type === "Claim Report Response" && notification.reportId) {
          navigate(`/claim-found-item/${notification.reportId}`);
        } else if (notification.reportId) {
          navigate(`/review-found-item/${notification.reportId}`);
        } else {
          console.error('No reportId in notification:', notification);
          // Handle the case where there's no reportId
          alert('Unable to view report details. Please try again later.');
        }

        setShowInbox(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', {
        notificationId: notification.id,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 404) {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setError('This notification no longer exists');
      } else if (error.response?.status === 401) {
        setIsAuthenticated(false);
        navigate('/login');
      } else {
        setError('Failed to update notification');
      }
    }
};


  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/api/auth/logout', { 
        withCredentials: true,
        timeout: 5000
      });
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const handleShowMore = () => {
    setVisibleNotificationsCount(notifications.length); // Show all notifications
  };

  // Close inbox when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInbox && !event.target.closest('.inbox-container')) {
        setShowInbox(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showInbox]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Lost and Found
        </Link>

        <div className="navbar-links">
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li>
              <Link to="/">Home</Link>
            </li>

            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                <li>
                  <Link to="/report-item">Report Item</Link>
                </li>
                <li>
                  <button 
                    className="logout-btn" 
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </li>
                <li>
                  <Link to="/chat-inbox">Chat Inbox</Link>
                </li>
                <div className="inbox-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInbox(!showInbox);
                    }}
                    className="inbox-button"
                    aria-label="Toggle inbox"
                    aria-expanded={showInbox}
                  >
                    Inbox
                    {unreadCount > 0 && (
                      <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showInbox && (
                    <div className="inbox-dropdown" role="menu">
                      {error && (
                        <p className="error-message" role="alert">{error}</p>
                      )}
                      {notifications.length > 0 ? (
                        <ul>
                         {notifications.slice(0, visibleNotificationsCount).map((notification) => (
  <li
    key={notification.id}
    onClick={() => handleNotificationClick(notification)}
    className={notification.read ? 'read' : 'unread'}
    role="menuitem"
    tabIndex={0}
    data-report-id={notification.reportId} // Add this line
  >
    <span className="notification-message">
      {notification.message}
    </span>
    <span className="notification-time">
      {new Date(notification.createdAt).toLocaleString()}
    </span>
  </li>
))}
                        </ul>
                      ) : (
                        <p>No notifications</p>
                      )}
                      {visibleNotificationsCount < notifications.length && (
                        <button onClick={handleShowMore} className="show-more-btn">
                          Show More
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <button 
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
