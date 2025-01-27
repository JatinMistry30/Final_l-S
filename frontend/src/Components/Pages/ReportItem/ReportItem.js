import React, { useState, useRef,useEffect } from 'react';
import axios from 'axios';
import './ReportItem.css';

const ReportItem = () => {
  const [type, setType] = useState('lost');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [userId, setUserId] = useState(null);
  const formRef = useRef(null);

  const handleTypeChange = (newType) => {
    setType(newType);
    formRef.current?.reset();
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const fetchUserId = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/userdetails', { withCredentials: true });
      if (response.data && response.data.userId) {
        setUserId(response.data.userId);  // Set the user ID in the state
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  
  useEffect(() => {
    fetchUserId();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target);
      formData.append('type', type);
      if (userId) {
        formData.append('userId', userId); // Append the userId to the formData
      }
      const response = await axios.post('http://localhost:5000/api/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials:true
      });

      if (response.data.success) {
        alert('Report submitted successfully!');
        formRef.current?.reset();
        setImagePreview(null);
      } else {
        throw new Error(response.data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(`Error submitting report: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'documents', label: 'Documents' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'bags', label: 'Bags & Wallets' },
    { value: 'others', label: 'Others' },
  ];

  return (
    <div className="report-wrapper">
      <div className="report-container">
        <h1 className="report-title">
          <span className="title-icon">
            {type === 'lost' ? '🔍' : '📦'}
          </span>
          Report {type === 'lost' ? 'Lost' : 'Found'} Item
        </h1>

        <div className="report-toggle">
          <button
            className={`toggle-btn ${type === 'lost' ? 'active' : ''}`}
            onClick={() => handleTypeChange('lost')}
          >
            Lost Item
          </button>
          <button
            className={`toggle-btn ${type === 'found' ? 'active' : ''}`}
            onClick={() => handleTypeChange('found')}
          >
            Found Item
          </button>
        </div>

        <form
          className="report-form"
          onSubmit={handleSubmit}
          ref={formRef}
          encType="multipart/form-data"
        >
          <div className="form-group">
            <label className="form-label">
              Item Name
              <input
                type="text"
                name="itemName"
                className="form-input"
                placeholder="Enter item name"
                required
              />
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">
                Description
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Provide detailed description of the item..."
                  rows="4"
                  required
                ></textarea>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Category
                <select name="category" className="form-select" required>
                  <option value="" disabled defaultValue>
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Location
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="Enter location"
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Date
                <input
                  type="date"
                  name="dateReported"
                  className="form-input"
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Time
                <input
                  type="time"
                  name="timeReported"
                  className="form-input"
                  required
                />
              </label>
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                Photo
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    capture="environment"
                    className="form-file-input"
                    onChange={handleImageChange}
                    required
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={`form-submit-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportItem;
