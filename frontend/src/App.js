import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Components/Navbar/Navbar';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import Home from './Components/Pages/Home/Home';
import Profile from './Components/Pages/Profile/Profile';
import ReportItem from './Components/Pages/ReportItem/ReportItem';
import ViewDetails from './Components/ViewDetails/ViewDetails';
import ReportFound from './Components/ReportFound/ReportFound';
import ReviewFoundItem from './Components/ReviewFoundItem/ReportFoundItem';
import ClaimFound from './Components/ClaimFound/ClaimFound';
import { io } from 'socket.io-client';  // Import WebSocket client
import './App.css';
import ClaimReviewItem from './Components/ClaimReiviewItem/ClaimReviewItem';
import ChatInbox from './Components/Pages/ChatInbox/ChatInbox';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Setup WebSocket connection
    const newSocket = io('http://localhost:5000', { withCredentials: true });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          withCredentials: true
        });
        
        setIsAuthenticated(response.data.valid);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="app">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          
          <Route path="/" element={<ProtectedRoute><Home  /></ProtectedRoute>} />
          <Route path="/chat-inbox" element={<ProtectedRoute><ChatInbox /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/report-item" element={<ProtectedRoute><ReportItem  /></ProtectedRoute>} />
          <Route path="/details/:id" element={<ProtectedRoute><ViewDetails /></ProtectedRoute>} />
          <Route path="/report-found/:id" element={<ProtectedRoute><ReportFound /></ProtectedRoute>} />
          <Route path="/review-found-item/:id" element={<ProtectedRoute><ReviewFoundItem /></ProtectedRoute>} />   
          <Route path="/claim-found/:id" element={<ProtectedRoute><ClaimFound /></ProtectedRoute>} />
          <Route path="/claim-found-item/:id" element={<ProtectedRoute><ClaimReviewItem /></ProtectedRoute>} />   
          

              </Routes>
      </div>
    </Router>
  );
};

export default App;
