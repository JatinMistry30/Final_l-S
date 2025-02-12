import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    course: "",
    year: "",
    mobile_number: "",
  });
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/profiledata",
          {
            withCredentials: true, // Include cookies in the request
          }
        );
        setUser(response.data);
        setFormData({
          age: response.data.age || "",
          course: response.data.course || "",
          year: response.data.year || "",
          mobile_number: response.data.mobile_number || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/auth/updateprofile",
        formData,
        {
          withCredentials: true,
        }
      );

      setUser(response.data);
      setIsEditing(false); 
      alert("Profile updated successfully!");


      await fetchProfile(); 
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/profiledata",
        {
          withCredentials: true,
        }
      );
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  if (!user) return <div>Loading...</div>;
  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:5000/api/auth/logout", {
        withCredentials: true,
        timeout: 5000,
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

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
      <button
        className="profile-update-button"
        onClick={isEditing ? handleUpdate : handleEditToggle}
      >
        {isEditing ? "Save Changes" : "Edit Profile"}
      </button>
      <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
        Logout
      </button>
    </div>
  );
};

export default Profile;
