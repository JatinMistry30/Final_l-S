import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ReportFoundItem.css';

const ReviewFoundItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        console.log('Fetching report details for ID:', id);
        const response = await axios.get(`http://localhost:5000/api/notification/found-reports/${id}`, {
          withCredentials: true,
        });
        console.log('Received report details:', response.data);
        setReport(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch report details:', err);
        setError(err.response?.data?.message || 'Failed to load report details');
        setLoading(false);
      }
    };

    if (id) {
      fetchReportDetails();
    }
  }, [id]);

  const handleResponse = async (status) => {
    try {
      await axios.post(
        `http://localhost:5000/api/notification/found-reports/${id}/respond`,
        { status },
        { withCredentials: true }
      );

      alert(`Successfully ${status === 'accepted' ? 'accepted' : 'rejected'} the report`);
      navigate('/profile');
    } catch (err) {
      console.error('Failed to process response:', err);
      alert(err.response?.data?.message || 'Failed to process your response');
    }
  };

  const handleChat = () => {
    navigate(`/chat-inbox/${report.finderEmail}`, {
      state: {
        prebuiltMessage: `Hey, what's about the product? (${report.itemName})`,
      },
    });
  };

  if (loading) {
    return (
      <div className="loading-container-review-found">
        <p className="loading-text-review-found">Loading report details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container-review-found">
        <div className="error-card-review-found">
          <p className="error-message-review-found">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="error-back-button-review-found"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="not-found-container-review-found">
        <div className="not-found-card-review-found">
          <p className="not-found-message-review-found">Report not found</p>
          <button
            onClick={() => navigate(-1)}
            className="not-found-back-button-review-found"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container-review-found">
      <h1 className="header-title-review-found">Found Item Report Details</h1>

      <div className="card-container-review-found">
        <div className="grid-container-review-found">
          <div className="item-details-section-review-found">
            <h2 className="section-title-review-found">Item Details</h2>
            <p className="section-content-review-found">
              <span className="content-label-review-found">Item Name:</span> {report.itemName}
            </p>
            <p className="section-content-review-found">
              <span className="content-label-review-found">Description:</span> {report.description}
            </p>
            <p className="section-content-review-found">
              <span className="content-label-review-found">Location Found:</span> {report.location}
            </p>
          </div>

          <div className="finder-details-section-review-found">
            <h2 className="section-title-review-found">Finder Details</h2>
            <p className="section-content-review-found">
              <span className="content-label-review-found">Found By:</span> {report.finderEmail}
            </p>
            <p className="section-content-review-found">
              <span className="content-label-review-found">Contact:</span> {report.finderMobile}
            </p>
          </div>

          {report.photoPath && (
            <div className="photo-section-review-found">
              <h2 className="section-title-review-found">Photo</h2>
              <img
                src={`http://localhost:5000/${report.photoPath}`}
                alt="Found item"
                className="photo-image-review-found"
              />
            </div>
          )}
        </div>
      </div>

      {report.status === 'pending' && (
        <div className="response-buttons-container-review-found">
          <button
            onClick={() => handleResponse('accepted')}
            className="accept-button-review-found"
          >
            Accept Report
          </button>
          <button
            onClick={() => handleResponse('rejected')}
            className="reject-button-review-found"
          >
            Reject Report
          </button>
          <button
            onClick={handleChat}
            className="chat-button-review-found"
          >
            Chat with User
          </button>
        </div>
      )}

      {report.status !== 'pending' && (
        <div className="already-processed-review-found">
          This report has already been {report.status}
        </div>
      )}
    </div>
  );
};

export default ReviewFoundItem;
