import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ViewDetails.css';

const API_BASE_URL = "http://localhost:5000";

const ViewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/items`);
        const selectedItem = response.data.items.find((i) => i.id === parseInt(id));
        
        if (!selectedItem) {
          setError("Item not found");
          return;
        }
        
        setItem(selectedItem);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

 
  
  const handleClaim = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/api/items/${id}`, { status: 'claimed' });
      setItem(prev => ({ ...prev, status: 'claimed' }));
    } catch (err) {
      alert("Failed to claim item. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Item Not Found</h2>
          <p>The requested item could not be found.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-details-container">
      <div className="navigation-bar">
        <button onClick={() => navigate(-1)} className="back-button">
          <span>←</span> Back to List
        </button>
      </div>

      <div className="item-details-card">
        <div className="item-image-container">
          <img
            src={item.photoPath ? `${API_BASE_URL}/uploads/${item.photoPath}` : "/api/placeholder/400/320"}
            alt={item.itemName}
            className="item-image-all"
          />
          <div className="item-status-badge">
            <span className={`status-indicator ${item.status}`}>
              {item.status || "Pending"}
            </span>
          </div>
        </div>

        <div className="item-content-all">
          <div className="item-header">
            <h1>{item.itemName}</h1>
            <span className="item-type">{item.type === "lost" ? "Lost Item" : "Found Item"}</span>
          </div>

          <div className="item-description">
            <p>{item.description}</p>
          </div>

          <div className="item-metadata">
            <div className="metadata-item">
              <span className="metadata-icon">📍</span>
              <div className="metadata-content">
                <label>Location</label>
                <span>{item.location}</span>
              </div>
            </div>

            <div className="metadata-item">
              <span className="metadata-icon">📅</span>
              <div className="metadata-content">
                <label>Date Reported</label>
                <span>{new Date(item.dateReported).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="action-container">
  {item.type === "lost" ? (
    <button
      onClick={() => navigate(`/report-found/${item.id}`)}
      disabled={item.status === 'found'}
      className={`action-button ${item.status === 'found' ? 'disabled' : ''}`}
    >
      {item.status === 'found' ? 'Item Has Been Found' : 'Report as Found'}
    </button>
  ) : (
    <button
      onClick={() => navigate(`/claim-found/${item.id}`)}
      disabled={item.status === 'claimed'}
      className={`action-button ${item.status === 'claimed' ? 'disabled' : ''}`}
    >
      {item.status === 'claimed' ? 'Item Has Been Claimed' : 'Claim This Item'}
    </button>
  )}
</div>

        </div>
      </div>
    </div>
  );
};

export default ViewDetails;