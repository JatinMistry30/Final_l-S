import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    course: '',
    year: '',
    mobile_number: '',
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profiledata', {
          withCredentials: true, // Include cookies in the request
        });
        setUser(response.data);
        setFormData({
          age: response.data.age || '',
          course: response.data.course || '',
          year: response.data.year || '',
          mobile_number: response.data.mobile_number || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);  // Empty dependency array ensures this runs once when the component mounts

  // Toggle edit mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle updating the profile
  const handleUpdate = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/updateprofile', formData, {
        withCredentials: true,
      });

      // After successful update, refetch the profile data
      setUser(response.data);  // Update the local state with the new user data
      setIsEditing(false);  // Switch off the edit mode
      alert('Profile updated successfully!');

      // Optionally, refetch the data to ensure consistency
      await fetchProfile();  // Re-fetch the profile data
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/profiledata', {
        withCredentials: true,
      });
      setUser(response.data);  // Update the user state with the latest data
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <h1 className="profile-title">Profile</h1>
      <div className="profile-details">
        <div className="profile-item">
          <strong>Username:</strong>
          {isEditing ? (
            <input
              type="text"
              name="username"
              value={user.username}
              disabled
              className="profile-input"
            />
          ) : (
            <p>{user.username}</p>
          )}
        </div>
        <div className="profile-item">
          <strong>Email:</strong>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={user.email}
              disabled
              className="profile-input"
            />
          ) : (
            <p>{user.email}</p>
          )}
        </div>
        <div className="profile-item">
          <strong>Age:</strong>
          {isEditing ? (
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="profile-input"
            />
          ) : (
            <p>{user.age}</p>
          )}
        </div>
        <div className="profile-item">
          <strong>Course:</strong>
          {isEditing ? (
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="profile-input"
            />
          ) : (
            <p>{user.course}</p>
          )}
        </div>
        <div className="profile-item">
          <strong>Year:</strong>
          {isEditing ? (
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="profile-input"
            />
          ) : (
            <p>{user.year}</p>
          )}
        </div>
        <div className="profile-item">
          <strong>Mobile Number:</strong>
          {isEditing ? (
            <input
              type="text"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleChange}
              className="profile-input"
            />
          ) : (
            <p>{user.mobile_number}</p>
          )}
        </div>
      </div>
      <button className="profile-update-button" onClick={isEditing ? handleUpdate : handleEditToggle}>
        {isEditing ? 'Save Changes' : 'Edit Profile'}
      </button>
    </div>
  );
};

export default Profile;
