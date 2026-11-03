import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';  
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

  const { username, password, confirmPassword, email, fullName } = formData;

  // Validation
  if (!username.trim() || !password.trim() || !email.trim()) {
    setMessage('Please fill in all required fields!');
    setMessageType('error');
    return;
  }

  if (password !== confirmPassword) {
    setMessage('Passwords do not match!');
    setMessageType('error');
    return;
  }

  setLoading(true);

  try {
    // I-check kung existing na ang username
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle();

    if (existingUser) {
      setMessage('Username already exists!');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // I-save sa Supabase
    const { error } = await supabase
      .from('users')
      .insert([
        {
          username: username.trim(),
          password: password.trim(), // Plain text muna para sa testing
          email: email.trim(),
          full_name: fullName.trim()
        }
      ]);

    if (error) throw error;

    setMessage('✓ Registration successful! Please login.');
    setMessageType('success');

    setTimeout(() => {
      navigate('/login');
    }, 1500);

  } catch (error) {
    console.error('Register error:', error);
    setMessage('✗ Registration failed: ' + error.message);
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