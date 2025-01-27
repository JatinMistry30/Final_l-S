import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import CryptoJS from 'crypto-js';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!email || !username) {
      alert('Please fill in username and email first');
      return;
    }

    try {
      const otpGenerated = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = CryptoJS.SHA256(otpGenerated).toString(CryptoJS.enc.Base64);
      
      sessionStorage.setItem('otpHash', otpHash);
      sessionStorage.setItem('otpTimestamp', Date.now().toString());

      await emailjs.send(
        'service_wng34lp',
        'template_xlzho6g',
        {
          username,
          email,
          otp: otpGenerated,
        },
        'SWN_cxD9ui_Vkvq6l'
      );

      setIsOtpSent(true);
      alert('OTP sent to your email!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      console.log('Starting registration process...');
      setIsSubmitting(true);

      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      console.log('Checking OTP...');
      const otpHash = sessionStorage.getItem('otpHash');
      const otpTimestamp = parseInt(sessionStorage.getItem('otpTimestamp') || '0');

      if (!otpHash || Date.now() - otpTimestamp > 120000) {
        setOtpError('OTP expired. Please request a new one.');
        setIsSubmitting(false);
        return;
      }

      const enteredOtpHash = CryptoJS.SHA256(otp).toString(CryptoJS.enc.Base64);
      if (enteredOtpHash !== otpHash) {
        setOtpError('Invalid OTP');
        setIsSubmitting(false);
        return;
      }

      console.log('Making API request...');
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response);

      if (response.data.msg === 'User registered successfully') {
        alert('Registration Successful');
        navigate('/login');
      } else {
        alert(response.data.msg || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      
      if (error.response?.data?.msg) {
        alert(error.response.data.msg);
      } else {
        alert('An error occurred during registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);
    if (confirmPassword && passwordValue !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPasswordValue = e.target.value;
    setConfirmPassword(confirmPasswordValue);
    if (password && password !== confirmPasswordValue) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-heading">Register</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="register-input"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="register-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          required
          className="register-input"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
          className="register-input"
        />
        {passwordError && <p className="error-text">{passwordError}</p>}
        {!isOtpSent ? (
          <button 
            type="button" 
            onClick={sendOtp} 
            className="register-button"
            disabled={!username || !email}
          >
            Send OTP
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="register-input"
            />
            {otpError && <p className="error-text">{otpError}</p>}
            <button 
              type="submit" 
              className="register-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Register;