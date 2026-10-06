import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { fullName, email, username, password, confirmPassword } = formData;

    if (!fullName || !email || !username || !password) {
      setMessage('Please fill in all required fields!');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match!');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http:///fitpicker-api/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName,
          email: email,
          username: username,
          password: password
        })
      });

      const result = await response.json();

      if (result.success === true) {
        setMessage('✓ Registration successful! Redirecting to login...');
        setMessageType('success');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage('✗ ' + result.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('✗ Connection error! Make sure XAMPP is running.');
      setMessageType('error');
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="brand-section">
          <span className="logo-icon">👔</span>
          <h1 className="brand-title">FitPicker</h1>
          <p className="brand-subtitle">Create Your Account</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
              <span 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              Show Password
            </label>
          </div>

          {message && (
            <div className={`status-message ${messageType}`}>
              {message}
            </div>
          )}

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;